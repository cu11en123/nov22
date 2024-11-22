import { format, subDays, startOfQuarter, endOfQuarter, subQuarters } from 'date-fns';

export const templates = {
  opportunities: {
    byStage: `SELECT StageName, COUNT(Id) total 
              FROM Opportunity 
              WHERE IsClosed = false 
              GROUP BY StageName`,
    topByAmount: `SELECT Name, Amount 
                  FROM Opportunity 
                  WHERE IsClosed = false 
                  ORDER BY Amount DESC 
                  LIMIT 5`,
  },
  accounts: {
    noActivity: `SELECT Id, Name 
                 FROM Account 
                 WHERE LastActivityDate < ${format(subDays(new Date(), 30), 'yyyy-MM-dd')}`,
    topByRevenue: `SELECT Name, AnnualRevenue 
                   FROM Account 
                   WHERE AnnualRevenue != null 
                   ORDER BY AnnualRevenue DESC 
                   LIMIT 5`,
  },
  leads: {
    recentlyCreated: `SELECT Id, Name, Company, Status 
                      FROM Lead 
                      WHERE CreatedDate = LAST_N_DAYS:7`,
    byStatus: `SELECT Status, COUNT(Id) total 
               FROM Lead 
               GROUP BY Status`,
  },
  cases: {
    openByPriority: `SELECT Priority, COUNT(Id) total 
                     FROM Case 
                     WHERE IsClosed = false 
                     GROUP BY Priority`,
    avgResolutionTime: `SELECT AVG(ClosedDate - CreatedDate) avgTime 
                        FROM Case 
                        WHERE IsClosed = true`,
  },
  kpis: {
    winRate: `SELECT 
                COUNT(Id) total,
                SUM(CASE WHEN IsWon = true THEN 1 ELSE 0 END) won
              FROM Opportunity 
              WHERE CloseDate = THIS_MONTH`,
    quarterlyRevenue: `SELECT SUM(Amount) revenue 
                       FROM Opportunity 
                       WHERE CloseDate >= ${format(startOfQuarter(new Date()), 'yyyy-MM-dd')}
                       AND CloseDate <= ${format(endOfQuarter(new Date()), 'yyyy-MM-dd')}
                       AND IsWon = true`,
    quarterComparison: `SELECT 
                          SUM(CASE 
                            WHEN CloseDate >= ${format(startOfQuarter(new Date()), 'yyyy-MM-dd')}
                            AND CloseDate <= ${format(endOfQuarter(new Date()), 'yyyy-MM-dd')}
                            THEN Amount ELSE 0 END) thisQuarter,
                          SUM(CASE 
                            WHEN CloseDate >= ${format(startOfQuarter(subQuarters(new Date(), 1)), 'yyyy-MM-dd')}
                            AND CloseDate <= ${format(endOfQuarter(subQuarters(new Date(), 1)), 'yyyy-MM-dd')}
                            THEN Amount ELSE 0 END) lastQuarter
                        FROM Opportunity 
                        WHERE IsWon = true`,
  },
};

export const getTemplateDescription = (category: string, template: string): string => {
  const descriptions: Record<string, Record<string, string>> = {
    opportunities: {
      byStage: 'Shows a breakdown of open opportunities by stage',
      topByAmount: 'Lists the top 5 open opportunities by amount',
    },
    accounts: {
      noActivity: 'Shows accounts with no activity in the last 30 days',
      topByRevenue: 'Lists the top 5 accounts by annual revenue',
    },
    leads: {
      recentlyCreated: 'Shows leads created in the last 7 days',
      byStatus: 'Shows a breakdown of leads by status',
    },
    cases: {
      openByPriority: 'Shows open cases grouped by priority',
      avgResolutionTime: 'Calculates the average case resolution time',
    },
    kpis: {
      winRate: 'Calculates the opportunity win rate for the current month',
      quarterlyRevenue: 'Shows total revenue for the current quarter',
      quarterComparison: 'Compares revenue between current and previous quarter',
    },
  };

  return descriptions[category]?.[template] || 'No description available';
};