import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { prisma } from '../lib/db';
import { z } from 'zod';

/**
 * Settings Lambda Handler
 * Manages user settings (GET/PUT)
 *
 * For demo: Uses a hardcoded demo user ID
 * TODO: Add authentication and extract userId from token
 */

const DEMO_USER_ID = 'demo-user';

// Validation schema for PUT requests
const settingsSchema = z.object({
  autoBlock: z.boolean().optional(),
  notifications: z.boolean().optional(),
  whitelistedDomains: z.array(z.string()).optional(),
});

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  console.log('Settings handler invoked:', {
    method: event.requestContext.http.method,
    path: event.rawPath
  });

  try {
    const method = event.requestContext.http.method;

    // TODO: When auth is implemented:
    // const userId = await validateToken(event.headers.authorization);
    // For demo: Use hardcoded demo user
    const userId = DEMO_USER_ID;

    if (method === 'GET') {
      // Get or create user settings
      let settings = await prisma.userSettings.findUnique({
        where: { userId },
      });

      // Create default settings if they don't exist
      if (!settings) {
        console.log('Creating default settings for user:', userId);

        // Ensure user exists first
        await prisma.user.upsert({
          where: { id: userId },
          update: {},
          create: {
            id: userId,
            cognitoId: 'demo-cognito-id',
            email: 'demo@example.com',
            tier: 'free',
          },
        });

        settings = await prisma.userSettings.create({
          data: {
            userId,
            autoBlock: true,
            notifications: true,
            whitelistedDomains: [],
          },
        });
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          autoBlock: settings.autoBlock,
          notifications: settings.notifications,
          whitelistedDomains: settings.whitelistedDomains,
        }),
      };
    } else if (method === 'PUT') {
      // Update settings
      const body = JSON.parse(event.body || '{}');
      const validationResult = settingsSchema.safeParse(body);

      if (!validationResult.success) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Invalid request',
            details: validationResult.error.errors,
          }),
        };
      }

      const updateData = validationResult.data;

      // Ensure user exists first
      await prisma.user.upsert({
        where: { id: userId },
        update: {},
        create: {
          id: userId,
          cognitoId: 'demo-cognito-id',
          email: 'demo@example.com',
          tier: 'free',
        },
      });

      // Update or create settings
      const settings = await prisma.userSettings.upsert({
        where: { userId },
        update: updateData,
        create: {
          userId,
          autoBlock: updateData.autoBlock ?? true,
          notifications: updateData.notifications ?? true,
          whitelistedDomains: updateData.whitelistedDomains ?? [],
        },
      });

      console.log('Settings updated for user:', userId);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          autoBlock: settings.autoBlock,
          notifications: settings.notifications,
          whitelistedDomains: settings.whitelistedDomains,
          message: 'Settings updated successfully',
        }),
      };
    }

    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('Error in settings handler:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
