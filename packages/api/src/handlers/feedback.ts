import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { prisma } from '../lib/db';
import { z } from 'zod';

/**
 * Feedback Lambda Handler
 * Submits user feedback on analysis accuracy
 *
 * For demo: Uses hardcoded demo user ID
 * TODO: Add authentication and extract userId from token
 */

const DEMO_USER_ID = 'demo-user';

// Validation schema for feedback
const feedbackSchema = z.object({
  analysisId: z.string().uuid(),
  correct: z.boolean(),
  actualThreat: z.string().optional(),
  comment: z.string().optional(),
});

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  console.log('Feedback handler invoked:', { path: event.rawPath });

  try {
    const body = JSON.parse(event.body || '{}');
    const validationResult = feedbackSchema.safeParse(body);

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

    const { analysisId, correct, actualThreat, comment } = validationResult.data;

    // TODO: When auth is implemented:
    // const userId = await validateToken(event.headers.authorization);
    // For demo: Use hardcoded demo user
    const userId = DEMO_USER_ID;

    // Verify the analysis exists
    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
    });

    if (!analysis) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Analysis not found',
          message: `No analysis found with ID: ${analysisId}`,
        }),
      };
    }

    // Ensure demo user exists
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

    // Check if feedback already exists for this analysis
    const existingFeedback = await prisma.feedback.findUnique({
      where: { analysisId },
    });

    if (existingFeedback) {
      return {
        statusCode: 409,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Feedback already exists',
          message: 'Feedback has already been submitted for this analysis',
        }),
      };
    }

    // Create feedback
    const feedback = await prisma.feedback.create({
      data: {
        analysisId,
        userId,
        correct,
        actualThreat: actualThreat || null,
        comment: comment || null,
      },
    });

    console.log('Feedback created:', { feedbackId: feedback.id, analysisId, correct });

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: feedback.id,
        analysisId: feedback.analysisId,
        correct: feedback.correct,
        actualThreat: feedback.actualThreat,
        comment: feedback.comment,
        timestamp: feedback.timestamp.toISOString(),
        message: 'Feedback submitted successfully',
      }),
    };
  } catch (error) {
    console.error('Error in feedback handler:', error);

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
