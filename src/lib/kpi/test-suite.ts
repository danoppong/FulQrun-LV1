import { createClient } from '@/lib/supabase/client';

type JSONValue = string | number | boolean | null | JSONValue[] | { [k: string]: JSONValue };

export interface IKPITestSuite {
  runAllTests(): Promise<TestResults>;
  testWinRateCalculation(): Promise<TestResult>;
  testRevenueGrowthCalculation(): Promise<TestResult>;
  testDealSizeCalculation(): Promise<TestResult>;
  testSalesCycleCalculation(): Promise<TestResult>;
  testLeadConversionCalculation(): Promise<TestResult>;
  testCACCalculation(): Promise<TestResult>;
  testQuotaAttainmentCalculation(): Promise<TestResult>;
  testCLVCalculation(): Promise<TestResult>;
  testPipelineCoverageCalculation(): Promise<TestResult>;
  testActivitiesPerRepCalculation(): Promise<TestResult>;
  testDataConsistency(): Promise<TestResult>;
  testPerformanceOptimization(): Promise<TestResult>;
}

export interface TestResult {
  testName: string;
  passed: boolean;
  executionTime: number;
  error?: string;
  details?: JSONValue;
  recommendations?: string[];
}

export interface TestResults {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  executionTime: number;
  results: TestResult[];
  summary: string;
}

export class KPITestSuite implements IKPITestSuite {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.supabase = createClient();
  }

  /**
   * Run all KPI tests
   */
  async runAllTests(): Promise<TestResults> {
    const startTime = Date.now();
    const results: TestResult[] = [];

    console.log('Starting KPI Test Suite...');

    // Run all individual tests
    const tests = [
      () => this.testWinRateCalculation(),
      () => this.testRevenueGrowthCalculation(),
      () => this.testDealSizeCalculation(),
      () => this.testSalesCycleCalculation(),
      () => this.testLeadConversionCalculation(),
      () => this.testCACCalculation(),
      () => this.testQuotaAttainmentCalculation(),
      () => this.testCLVCalculation(),
      () => this.testPipelineCoverageCalculation(),
      () => this.testActivitiesPerRepCalculation(),
      () => this.testDataConsistency(),
      () => this.testPerformanceOptimization()
    ];

    for (const test of tests) {
      try {
        const result = await test();
        results.push(result);
        console.log(`${result.testName}: ${result.passed ? 'PASSED' : 'FAILED'}`);
      } catch (error) {
        results.push({
          testName: test.name,
          passed: false,
          executionTime: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        console.error(`Test ${test.name} failed:`, error);
      }
    }

    const executionTime = Date.now() - startTime;
    const passedTests = results.filter(r => r.passed).length;
    const failedTests = results.length - passedTests;

    return {
      totalTests: results.length,
      passedTests,
      failedTests,
      executionTime,
      results,
      summary: `${passedTests}/${results.length} tests passed in ${executionTime}ms`
    };
  }

  /**
   * Test Win Rate calculation accuracy
   */
  async testWinRateCalculation(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // Create test data
      const testOrgId = await this.createTestOrganization();
      const testUserId = await this.createTestUser(testOrgId);
      
      // Create test opportunities
      await this.createTestOpportunities(testOrgId, testUserId, [
        { stage: 'closed_won', deal_value: 100000 },
        { stage: 'closed_won', deal_value: 150000 },
        { stage: 'closed_lost', deal_value: 200000 },
        { stage: 'closed_lost', deal_value: 75000 }
      ]);

      // Calculate win rate
      const { data, error } = await this.supabase.rpc('calculate_win_rate', {
        p_organization_id: testOrgId,
        p_user_id: testUserId,
        p_territory_id: null,
        p_period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        p_period_end: new Date().toISOString().split('T')[0]
      });

      if (error) {
        throw new Error(`Win rate calculation failed: ${error.message}`);
      }

      // Validate results
      const expectedWinRate = 50; // 2 won out of 4 total
      const actualWinRate = data.win_rate;
      const passed = Math.abs(actualWinRate - expectedWinRate) < 0.1;

      // Cleanup
      await this.cleanupTestData(testOrgId);

      return {
        testName: 'Win Rate Calculation',
        passed,
        executionTime: Date.now() - startTime,
        details: {
          expected: expectedWinRate,
          actual: actualWinRate,
          totalOpportunities: data.total_opportunities,
          wonOpportunities: data.won_opportunities
        },
        recommendations: passed ? [] : ['Review win rate calculation logic', 'Check opportunity stage mapping']
      };
    } catch (error) {
      return {
        testName: 'Win Rate Calculation',
        passed: false,
        executionTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test Revenue Growth calculation accuracy
   */
  async testRevenueGrowthCalculation(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const testOrgId = await this.createTestOrganization();
      const testUserId = await this.createTestUser(testOrgId);
      
      // Create opportunities for current period
      await this.createTestOpportunities(testOrgId, testUserId, [
        { stage: 'closed_won', deal_value: 100000, close_date: new Date() },
        { stage: 'closed_won', deal_value: 150000, close_date: new Date() }
      ]);

      // Create opportunities for previous period
      const previousPeriodStart = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
      const previousPeriodEnd = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      await this.createTestOpportunities(testOrgId, testUserId, [
        { stage: 'closed_won', deal_value: 80000, close_date: previousPeriodStart },
        { stage: 'closed_won', deal_value: 120000, close_date: previousPeriodEnd }
      ]);

      // Calculate revenue growth
      const { data, error } = await this.supabase.rpc('calculate_revenue_growth', {
        p_organization_id: testOrgId,
        p_user_id: testUserId,
        p_territory_id: null,
        p_period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        p_period_end: new Date().toISOString().split('T')[0]
      });

      if (error) {
        throw new Error(`Revenue growth calculation failed: ${error.message}`);
      }

      // Validate results
      const expectedCurrentRevenue = 250000;
      const expectedPreviousRevenue = 200000;
      const expectedGrowthPercentage = 25; // (250000 - 200000) / 200000 * 100
      
      const passed = Math.abs(data.growth_percentage - expectedGrowthPercentage) < 0.1 &&
                    Math.abs(data.current_period_revenue - expectedCurrentRevenue) < 0.01 &&
                    Math.abs(data.previous_period_revenue - expectedPreviousRevenue) < 0.01;

      await this.cleanupTestData(testOrgId);

      return {
        testName: 'Revenue Growth Calculation',
        passed,
        executionTime: Date.now() - startTime,
        details: {
          expectedCurrentRevenue,
          actualCurrentRevenue: data.current_period_revenue,
          expectedPreviousRevenue,
          actualPreviousRevenue: data.previous_period_revenue,
          expectedGrowthPercentage,
          actualGrowthPercentage: data.growth_percentage
        },
        recommendations: passed ? [] : ['Review revenue growth calculation logic', 'Check period date filtering']
      };
    } catch (error) {
      return {
        testName: 'Revenue Growth Calculation',
        passed: false,
        executionTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test Average Deal Size calculation accuracy
   */
  async testDealSizeCalculation(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const testOrgId = await this.createTestOrganization();
      const testUserId = await this.createTestUser(testOrgId);
      
      const dealValues = [100000, 150000, 200000, 75000];
      await this.createTestOpportunities(testOrgId, testUserId, 
        dealValues.map(value => ({ stage: 'closed_won', deal_value: value }))
      );

      const { data, error } = await this.supabase.rpc('calculate_avg_deal_size', {
        p_organization_id: testOrgId,
        p_user_id: testUserId,
        p_territory_id: null,
        p_period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        p_period_end: new Date().toISOString().split('T')[0]
      });

      if (error) {
        throw new Error(`Deal size calculation failed: ${error.message}`);
      }

      const expectedAvgDealSize = dealValues.reduce((sum, val) => sum + val, 0) / dealValues.length;
      const passed = Math.abs(data.avg_deal_size - expectedAvgDealSize) < 0.01;

      await this.cleanupTestData(testOrgId);

      return {
        testName: 'Average Deal Size Calculation',
        passed,
        executionTime: Date.now() - startTime,
        details: {
          expectedAvgDealSize,
          actualAvgDealSize: data.avg_deal_size,
          totalDeals: data.total_deals,
          totalRevenue: data.total_revenue
        },
        recommendations: passed ? [] : ['Review average deal size calculation', 'Check deal value aggregation']
      };
    } catch (error) {
      return {
        testName: 'Average Deal Size Calculation',
        passed: false,
        executionTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test Sales Cycle Length calculation accuracy
   */
  async testSalesCycleCalculation(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const testOrgId = await this.createTestOrganization();
      const testUserId = await this.createTestUser(testOrgId);
      
      // Create opportunities with known cycle lengths
      const now = new Date();
      const cycleLengths = [30, 45, 60, 90]; // days
      
      for (let i = 0; i < cycleLengths.length; i++) {
        const createdDate = new Date(now.getTime() - cycleLengths[i] * 24 * 60 * 60 * 1000);
        const closeDate = new Date(now);
        
        await this.createTestOpportunity(testOrgId, testUserId, {
          stage: 'closed_won',
          deal_value: 100000,
          created_at: createdDate.toISOString(),
          close_date: closeDate.toISOString().split('T')[0]
        });
      }

      const { data, error } = await this.supabase.rpc('calculate_sales_cycle_length', {
        p_organization_id: testOrgId,
        p_user_id: testUserId,
        p_territory_id: null,
        p_period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        p_period_end: new Date().toISOString().split('T')[0]
      });

      if (error) {
        throw new Error(`Sales cycle calculation failed: ${error.message}`);
      }

      const expectedAvgCycleLength = cycleLengths.reduce((sum, val) => sum + val, 0) / cycleLengths.length;
      const passed = Math.abs(data.avg_cycle_length - expectedAvgCycleLength) < 0.1;

      await this.cleanupTestData(testOrgId);

      return {
        testName: 'Sales Cycle Length Calculation',
        passed,
        executionTime: Date.now() - startTime,
        details: {
          expectedAvgCycleLength,
          actualAvgCycleLength: data.avg_cycle_length,
          totalDeals: data.total_deals,
          totalDays: data.total_days
        },
        recommendations: passed ? [] : ['Review sales cycle calculation logic', 'Check date difference calculations']
      };
    } catch (error) {
      return {
        testName: 'Sales Cycle Length Calculation',
        passed: false,
        executionTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test Lead Conversion Rate calculation accuracy
   */
  async testLeadConversionCalculation(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const testOrgId = await this.createTestOrganization();
      const testUserId = await this.createTestUser(testOrgId);
      
      // Create test leads
      await this.createTestLeads(testOrgId, testUserId, [
        { status: 'qualified' },
        { status: 'qualified' },
        { status: 'unqualified' },
        { status: 'new' }
      ]);

      // Create opportunities from qualified leads
      await this.createTestOpportunities(testOrgId, testUserId, [
        { stage: 'qualifying' },
        { stage: 'proposal' }
      ]);

      const { data, error } = await this.supabase.rpc('calculate_lead_conversion_rate', {
        p_organization_id: testOrgId,
        p_user_id: testUserId,
        p_territory_id: null,
        p_period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        p_period_end: new Date().toISOString().split('T')[0]
      });

      if (error) {
        throw new Error(`Lead conversion calculation failed: ${error.message}`);
      }

      // Expected: 2 qualified opportunities out of 4 total leads = 50%
      const expectedConversionRate = 50;
      const passed = Math.abs(data.conversion_rate - expectedConversionRate) < 0.1;

      await this.cleanupTestData(testOrgId);

      return {
        testName: 'Lead Conversion Rate Calculation',
        passed,
        executionTime: Date.now() - startTime,
        details: {
          expectedConversionRate,
          actualConversionRate: data.conversion_rate,
          totalLeads: data.total_leads,
          qualifiedOpportunities: data.qualified_opportunities
        },
        recommendations: passed ? [] : ['Review lead conversion calculation', 'Check lead-to-opportunity mapping']
      };
    } catch (error) {
      return {
        testName: 'Lead Conversion Rate Calculation',
        passed: false,
        executionTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test Customer Acquisition Cost calculation accuracy
   */
  async testCACCalculation(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const testOrgId = await this.createTestOrganization();
      const testUserId = await this.createTestUser(testOrgId);
      
      // Create test opportunities (simplified CAC calculation)
      await this.createTestOpportunities(testOrgId, testUserId, [
        { stage: 'closed_won', deal_value: 100000 },
        { stage: 'closed_won', deal_value: 150000 }
      ]);

      const { data, error } = await this.supabase.rpc('calculate_cac', {
        p_organization_id: testOrgId,
        p_user_id: testUserId,
        p_territory_id: null,
        p_period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        p_period_end: new Date().toISOString().split('T')[0]
      });

      if (error) {
        throw new Error(`CAC calculation failed: ${error.message}`);
      }

      // Validate that CAC is calculated (simplified test)
      const passed = data.cac > 0 && data.new_customers > 0;

      await this.cleanupTestData(testOrgId);

      return {
        testName: 'Customer Acquisition Cost Calculation',
        passed,
        executionTime: Date.now() - startTime,
        details: {
          cac: data.cac,
          newCustomers: data.new_customers,
          totalCost: data.total_cost
        },
        recommendations: passed ? [] : ['Review CAC calculation logic', 'Check cost tracking implementation']
      };
    } catch (error) {
      return {
        testName: 'Customer Acquisition Cost Calculation',
        passed: false,
        executionTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test Quota Attainment calculation accuracy
   */
  async testQuotaAttainmentCalculation(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const testOrgId = await this.createTestOrganization();
      const testUserId = await this.createTestUser(testOrgId);
      
      // Create quota plan
      const quotaTarget = 200000;
      await this.createTestQuotaPlan(testOrgId, testUserId, quotaTarget);
      
      // Create opportunities
      await this.createTestOpportunities(testOrgId, testUserId, [
        { stage: 'closed_won', deal_value: 120000 },
        { stage: 'closed_won', deal_value: 100000 }
      ]);

      const { data, error } = await this.supabase.rpc('calculate_quota_attainment', {
        p_organization_id: testOrgId,
        p_user_id: testUserId,
        p_territory_id: null,
        p_period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        p_period_end: new Date().toISOString().split('T')[0]
      });

      if (error) {
        throw new Error(`Quota attainment calculation failed: ${error.message}`);
      }

      const expectedAttainmentPercentage = 110; // (220000 / 200000) * 100
      const passed = Math.abs(data.attainment_percentage - expectedAttainmentPercentage) < 0.1;

      await this.cleanupTestData(testOrgId);

      return {
        testName: 'Quota Attainment Calculation',
        passed,
        executionTime: Date.now() - startTime,
        details: {
          expectedAttainmentPercentage,
          actualAttainmentPercentage: data.attainment_percentage,
          quotaTarget: data.quota_target,
          actualAchievement: data.actual_achievement
        },
        recommendations: passed ? [] : ['Review quota attainment calculation', 'Check quota plan integration']
      };
    } catch (error) {
      return {
        testName: 'Quota Attainment Calculation',
        passed: false,
        executionTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test Customer Lifetime Value calculation accuracy
   */
  async testCLVCalculation(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const testOrgId = await this.createTestOrganization();
      const testUserId = await this.createTestUser(testOrgId);
      
      // Create test opportunities for CLV calculation
      await this.createTestOpportunities(testOrgId, testUserId, [
        { stage: 'closed_won', deal_value: 100000 },
        { stage: 'closed_won', deal_value: 150000 }
      ]);

      const { data, error } = await this.supabase.rpc('calculate_clv', {
        p_organization_id: testOrgId,
        p_user_id: testUserId,
        p_territory_id: null,
        p_period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        p_period_end: new Date().toISOString().split('T')[0]
      });

      if (error) {
        throw new Error(`CLV calculation failed: ${error.message}`);
      }

      // Validate that CLV is calculated
      const passed = data.clv > 0 && data.avg_purchase_value > 0;

      await this.cleanupTestData(testOrgId);

      return {
        testName: 'Customer Lifetime Value Calculation',
        passed,
        executionTime: Date.now() - startTime,
        details: {
          clv: data.clv,
          avgPurchaseValue: data.avg_purchase_value,
          purchaseFrequency: data.purchase_frequency,
          customerLifespanMonths: data.customer_lifespan_months
        },
        recommendations: passed ? [] : ['Review CLV calculation logic', 'Check customer lifespan calculations']
      };
    } catch (error) {
      return {
        testName: 'Customer Lifetime Value Calculation',
        passed: false,
        executionTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test Pipeline Coverage calculation accuracy
   */
  async testPipelineCoverageCalculation(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const testOrgId = await this.createTestOrganization();
      const testUserId = await this.createTestUser(testOrgId);
      
      // Create quota plan
      const quotaTarget = 300000;
      await this.createTestQuotaPlan(testOrgId, testUserId, quotaTarget);
      
      // Create pipeline opportunities
      await this.createTestOpportunities(testOrgId, testUserId, [
        { stage: 'prospecting', deal_value: 100000 },
        { stage: 'qualifying', deal_value: 150000 },
        { stage: 'proposal', deal_value: 200000 }
      ]);

      const { data, error } = await this.supabase.rpc('calculate_pipeline_coverage', {
        p_organization_id: testOrgId,
        p_user_id: testUserId,
        p_territory_id: null,
        p_period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        p_period_end: new Date().toISOString().split('T')[0]
      });

      if (error) {
        throw new Error(`Pipeline coverage calculation failed: ${error.message}`);
      }

      const expectedCoverageRatio = 1.5; // 450000 / 300000
      const passed = Math.abs(data.coverage_ratio - expectedCoverageRatio) < 0.1;

      await this.cleanupTestData(testOrgId);

      return {
        testName: 'Pipeline Coverage Calculation',
        passed,
        executionTime: Date.now() - startTime,
        details: {
          expectedCoverageRatio,
          actualCoverageRatio: data.coverage_ratio,
          totalPipelineValue: data.total_pipeline_value,
          salesQuota: data.sales_quota
        },
        recommendations: passed ? [] : ['Review pipeline coverage calculation', 'Check pipeline stage filtering']
      };
    } catch (error) {
      return {
        testName: 'Pipeline Coverage Calculation',
        passed: false,
        executionTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test Activities per Rep calculation accuracy
   */
  async testActivitiesPerRepCalculation(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const testOrgId = await this.createTestOrganization();
      const testUserId = await this.createTestUser(testOrgId);
      
      // Create test activities
      await this.createTestActivities(testOrgId, testUserId, [
        { type: 'call' },
        { type: 'email' },
        { type: 'meeting' },
        { type: 'demo' },
        { type: 'presentation' }
      ]);

      const { data, error } = await this.supabase.rpc('calculate_activities_per_rep', {
        p_organization_id: testOrgId,
        p_user_id: testUserId,
        p_territory_id: null,
        p_period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        p_period_end: new Date().toISOString().split('T')[0]
      });

      if (error) {
        throw new Error(`Activities per rep calculation failed: ${error.message}`);
      }

      const expectedActivitiesPerDay = 5 / 30; // 5 activities over 30 days
      const passed = Math.abs(data.activities_per_day - expectedActivitiesPerDay) < 0.1;

      await this.cleanupTestData(testOrgId);

      return {
        testName: 'Activities per Rep Calculation',
        passed,
        executionTime: Date.now() - startTime,
        details: {
          expectedActivitiesPerDay,
          actualActivitiesPerDay: data.activities_per_day,
          totalActivities: data.total_activities,
          calls: data.calls,
          emails: data.emails,
          meetings: data.meetings
        },
        recommendations: passed ? [] : ['Review activities per rep calculation', 'Check activity type counting']
      };
    } catch (error) {
      return {
        testName: 'Activities per Rep Calculation',
        passed: false,
        executionTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test data consistency across KPI tables
   */
  async testDataConsistency(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const testOrgId = await this.createTestOrganization();
      
      // Create comprehensive test data
      const testUserId = await this.createTestUser(testOrgId);
      await this.createTestOpportunities(testOrgId, testUserId, [
        { stage: 'closed_won', deal_value: 100000 },
        { stage: 'closed_lost', deal_value: 50000 }
      ]);
      await this.createTestActivities(testOrgId, testUserId, [
        { type: 'call' },
        { type: 'email' }
      ]);
      await this.createTestLeads(testOrgId, testUserId, [
        { status: 'qualified' },
        { status: 'unqualified' }
      ]);

      // Calculate all KPIs
      const { data: allKPIs, error: kpiError } = await this.supabase.rpc('calculate_all_kpis', {
        p_organization_id: testOrgId,
        p_user_id: testUserId,
        p_territory_id: null,
        p_period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        p_period_end: new Date().toISOString().split('T')[0]
      });

      if (kpiError) {
        throw new Error(`KPI calculation failed: ${kpiError.message}`);
      }

      // Validate data consistency
      const inconsistencies: string[] = [];
      
      if (allKPIs.win_rate?.total_opportunities !== 2) {
        inconsistencies.push('Win rate total opportunities mismatch');
      }
      
      if (allKPIs.win_rate?.won_opportunities !== 1) {
        inconsistencies.push('Win rate won opportunities mismatch');
      }
      
      if (allKPIs.activities_per_rep?.total_activities !== 2) {
        inconsistencies.push('Activities total count mismatch');
      }

      const passed = inconsistencies.length === 0;

      await this.cleanupTestData(testOrgId);

      return {
        testName: 'Data Consistency',
        passed,
        executionTime: Date.now() - startTime,
        details: {
          inconsistencies,
          kpiData: allKPIs
        },
        recommendations: passed ? [] : ['Fix data consistency issues', 'Review data synchronization logic']
      };
    } catch (error) {
      return {
        testName: 'Data Consistency',
        passed: false,
        executionTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test performance optimization
   */
  async testPerformanceOptimization(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const testOrgId = await this.createTestOrganization();
      
      // Create large dataset for performance testing
      const testUserId = await this.createTestUser(testOrgId);
      
      // Create 1000 opportunities
      const opportunities = Array.from({ length: 1000 }, (_, i) => ({
        stage: i % 3 === 0 ? 'closed_won' : i % 3 === 1 ? 'closed_lost' : 'prospecting',
        deal_value: Math.floor(Math.random() * 500000) + 50000
      }));
      
      await this.createTestOpportunities(testOrgId, testUserId, opportunities);

      // Measure calculation time
      const calcStartTime = Date.now();
      const { data, error } = await this.supabase.rpc('calculate_all_kpis', {
        p_organization_id: testOrgId,
        p_user_id: testUserId,
        p_territory_id: null,
        p_period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        p_period_end: new Date().toISOString().split('T')[0]
      });
      const calcTime = Date.now() - calcStartTime;

      if (error) {
        throw new Error(`Performance test failed: ${error.message}`);
      }

      // Performance should be under 5 seconds for 1000 records
      const passed = calcTime < 5000;

      await this.cleanupTestData(testOrgId);

      return {
        testName: 'Performance Optimization',
        passed,
        executionTime: Date.now() - startTime,
        details: {
          calculationTime: calcTime,
          recordCount: 1000,
          performanceThreshold: 5000
        },
        recommendations: passed ? [] : ['Optimize database queries', 'Add indexes for better performance', 'Consider data pagination']
      };
    } catch (error) {
      return {
        testName: 'Performance Optimization',
        passed: false,
        executionTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Helper methods for test data creation

  private async createTestOrganization(): Promise<string> {
    const { data, error } = await this.supabase
      .from('organizations')
      .insert({
        name: `Test Org ${Date.now()}`,
        industry: 'technology',
        size: 'medium'
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to create test organization: ${error.message}`);
    }

    return data.id;
  }

  private async createTestUser(organizationId: string): Promise<string> {
    const { data, error } = await this.supabase
      .from('users')
      .insert({
        email: `testuser${Date.now()}@example.com`,
        first_name: 'Test',
        last_name: 'User',
        role: 'sales_rep',
        organization_id: organizationId
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to create test user: ${error.message}`);
    }

    return data.id;
  }

  private async createTestOpportunities(organizationId: string, userId: string, opportunities: unknown[]): Promise<void> {
    for (const opp of opportunities) {
      await this.createTestOpportunity(organizationId, userId, opp);
    }
  }

  private async createTestOpportunity(organizationId: string, userId: string, opportunity: Partial<{ stage: string; deal_value: number; close_date: string; created_at: string }>): Promise<void> {
    const { error } = await this.supabase
      .from('opportunities')
      .insert({
        name: `Test Opportunity ${Date.now()}`,
        stage: opportunity.stage || 'prospecting',
        deal_value: opportunity.deal_value || 100000,
        close_date: opportunity.close_date || new Date().toISOString().split('T')[0],
        created_at: opportunity.created_at || new Date().toISOString(),
        organization_id: organizationId,
        assigned_to: userId,
        created_by: userId
      });

    if (error) {
      throw new Error(`Failed to create test opportunity: ${error.message}`);
    }
  }

  private async createTestActivities(organizationId: string, userId: string, activities: unknown[]): Promise<void> {
    for (const activity of activities) {
      const { error } = await this.supabase
        .from('activities')
        .insert({
          type: activity.type,
          subject: `Test ${activity.type} ${Date.now()}`,
          description: 'Test activity',
          status: 'completed',
          organization_id: organizationId,
          assigned_to: userId,
          created_by: userId
        });

      if (error) {
        throw new Error(`Failed to create test activity: ${error.message}`);
      }
    }
  }

  private async createTestLeads(organizationId: string, userId: string, leads: unknown[]): Promise<void> {
    for (const lead of leads) {
      const { error } = await this.supabase
        .from('leads')
        .insert({
          first_name: 'Test',
          last_name: `Lead ${Date.now()}`,
          email: `testlead${Date.now()}@example.com`,
          status: lead.status || 'new',
          organization_id: organizationId,
          created_by: userId
        });

      if (error) {
        throw new Error(`Failed to create test lead: ${error.message}`);
      }
    }
  }

  private async createTestQuotaPlan(organizationId: string, userId: string, targetAmount: number): Promise<void> {
    const { error } = await this.supabase
      .from('quota_plans')
      .insert({
        name: `Test Quota ${Date.now()}`,
        target_amount: targetAmount,
        period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        period_end: new Date().toISOString().split('T')[0],
        organization_id: organizationId,
        assigned_user_id: userId,
        created_by: userId
      });

    if (error) {
      throw new Error(`Failed to create test quota plan: ${error.message}`);
    }
  }

  private async cleanupTestData(organizationId: string): Promise<void> {
    // Clean up test data
    await this.supabase.from('opportunities').delete().eq('organization_id', organizationId);
    await this.supabase.from('activities').delete().eq('organization_id', organizationId);
    await this.supabase.from('leads').delete().eq('organization_id', organizationId);
    await this.supabase.from('quota_plans').delete().eq('organization_id', organizationId);
    await this.supabase.from('users').delete().eq('organization_id', organizationId);
    await this.supabase.from('organizations').delete().eq('id', organizationId);
  }
}

// Export singleton instance
export const kpiTestSuite = new KPITestSuite();
