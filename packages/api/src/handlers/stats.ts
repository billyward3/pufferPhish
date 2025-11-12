import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { prisma } from '../lib/db';

/**
 * Stats Lambda Handler
 * Retrieves user statistics and recent analyses
 *
 * For demo: Returns stats for all analyses (no auth required)
 * TODO: Add authentication and filter by userId
 */
export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  console.log('Stats handler invoked:', { path: event.rawPath });

  try {
    // TODO: When auth is implemented:
    // const userId = await validateToken(event.headers.authorization);
    // For demo: Show all analyses
    const userId = undefined;

    // Get total scan count
    const totalScans = await prisma.analysis.count({
      where: userId ? { userId } : {},
    });

    // Get threats blocked count (risk score >= 0.7)
    const threatsBlocked = await prisma.analysis.count({
      where: {
        ...(userId ? { userId } : {}),
        blocked: true,
      },
    });

    // Get recent analyses (last 10)
    const recentAnalyses = await prisma.analysis.findMany({
      where: userId ? { userId } : {},
      orderBy: {
        timestamp: 'desc',
      },
      take: 10,
      select: {
        id: true,
        url: true,
        domain: true,
        riskScore: true,
        threats: true,
        blocked: true,
        source: true,
        timestamp: true,
      },
    });

    // Calculate average risk score
    const analyses = await prisma.analysis.findMany({
      where: userId ? { userId } : {},
      select: {
        riskScore: true,
      },
    });

    const avgRiskScore = analyses.length > 0
      ? analyses.reduce((sum, a) => sum + a.riskScore, 0) / analyses.length
      : 0;

    const stats = {
      totalScans,
      threatsBlocked,
      avgRiskScore: Math.round(avgRiskScore * 100) / 100,
      safeScans: totalScans - threatsBlocked,
      recentAnalyses: recentAnalyses.map(analysis => ({
        id: analysis.id,
        url: analysis.url,
        domain: analysis.domain,
        riskScore: analysis.riskScore,
        threats: analysis.threats,
        blocked: analysis.blocked,
        source: analysis.source,
        timestamp: analysis.timestamp.toISOString(),
      })),
    };

    console.log('Stats retrieved:', { totalScans, threatsBlocked });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stats),
    };
  } catch (error) {
    console.error('Error in stats handler:', error);

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
