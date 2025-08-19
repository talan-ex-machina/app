/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server';

interface ProductData {
  name: string;
  description: string;
  target_market: string;
  key_features: string[];
  value_proposition: string;
  pricing_model: string;
  competitive_advantage: string;
}

interface GTMPlanRequest {
  product_data: ProductData;
  framework: string;
  company_context?: any;
  idol_companies?: string[];
}

// Helper functions for generating specific insights
function getSpecificTargetAudience(product: ProductData): string {
  const keywords = product.description.toLowerCase();
  if (keywords.includes('ai') || keywords.includes('analytics')) return 'CTOs and Data Directors seeking AI-driven insights';
  if (keywords.includes('saas') || keywords.includes('platform')) return 'IT Directors and VP of Operations looking for scalable solutions';
  if (keywords.includes('consulting') || keywords.includes('advisory')) return 'C-suite executives requiring strategic guidance';
  if (keywords.includes('automation')) return 'Operations Managers aiming to reduce manual processes';
  return 'Innovation-focused leaders in technology-driven organizations';
}

function getAudiencePainPoints(product: ProductData): string {
  const features = product.key_features.join(' ').toLowerCase();
  if (features.includes('integration')) return 'struggle with fragmented systems and data silos';
  if (features.includes('automation')) return 'are overwhelmed by manual processes consuming valuable resources';
  if (features.includes('analytics')) return 'lack actionable insights from their data investments';
  if (features.includes('scalability')) return 'face growth limitations with current infrastructure';
  return 'need breakthrough solutions to maintain competitive advantage';
}

function getCategoryPositioning(product: ProductData): string {
  const type = product.description.toLowerCase();
  if (type.includes('platform')) return 'the definitive platform solution';
  if (type.includes('service')) return 'a premium service offering';
  if (type.includes('tool')) return 'an essential business tool';
  if (type.includes('system')) return 'a comprehensive system';
  return 'a category-defining solution';
}

function getOptimalMarkets(product: ProductData): string {
  const market = product.target_market?.toLowerCase() || '';
  if (market.includes('enterprise')) return 'Enterprise markets in North America and Western Europe';
  if (market.includes('mid-market') || market.includes('medium')) return 'High-growth mid-market segments across major metropolitan areas';
  if (market.includes('startup')) return 'Innovation hubs including Silicon Valley, Austin, and European tech centers';
  if (market.includes('global')) return 'Global markets with emphasis on technology-forward regions';
  return 'Primary markets in developed economies with strong technology adoption';
}

function getSpecificGeography(_product: ProductData): string {
  return 'tier-1 cities where digital transformation budgets exceed $1M annually';
}

function getMarketConditions(_product: ProductData): string {
  return 'technology spending is increasing 12-15% year-over-year and decision cycles are accelerating';
}

function getLaunchTiming(product: ProductData): string {
  const urgency = product.competitive_advantage?.toLowerCase().includes('first') ? 'Immediate market entry (Q1 2025)' : 'Strategic Q2 2025 launch';
  return urgency;
}

function getPhaseStrategy(_product: ProductData): string {
  return 'Phase 1: Beta with 10 key accounts (8 weeks), Phase 2: Limited GA (12 weeks), Phase 3: Full scale (ongoing)';
}

function getMarketOpportunity(product: ProductData): string {
  const desc = product.description.toLowerCase();
  if (desc.includes('ai')) return 'The $1.8T AI transformation market';
  if (desc.includes('automation')) return 'The $280B process automation opportunity';
  if (desc.includes('analytics')) return 'The $420B data analytics revolution';
  if (desc.includes('cloud')) return 'The $832B cloud migration wave';
  return 'The $2.1T digital transformation market';
}

function getRevenueOpportunity(_product: ProductData): string {
  return 'capture 0.1% market share within 18 months, representing $180M+ ARR potential';
}

function getChannelStrategy(product: ProductData): string {
  const pricing = product.pricing_model?.toLowerCase() || '';
  if (pricing.includes('subscription')) return 'Direct SaaS sales with partner-enabled trials';
  if (pricing.includes('enterprise')) return 'Enterprise direct sales with channel partner support';
  if (pricing.includes('freemium')) return 'Product-led growth with freemium onboarding';
  return 'Hybrid direct-partner channel strategy';
}

function getImplementationStrategy(_product: ProductData): string {
  return 'White-glove onboarding for enterprises, self-service for mid-market, with 24/7 success team support';
}

export async function POST(req: NextRequest) {
  try {
    const body: GTMPlanRequest = await req.json();
    const { product_data, framework } = body;

    // Mock GTM plan response based on framework
    const frameworkData = {
      crossing_chasm: {
        framework_elements: {
          early_adopters: "Technology enthusiasts and visionaries who are willing to try new solutions",
          chasm_crossing: "Focus on creating compelling value propositions for pragmatists",
          mainstream_market: "Conservative buyers who want proven solutions and references",
          competitive_advantage: "First-mover advantage in emerging market segments"
        },
        phases: [
          {
            phase_number: 1,
            phase_name: "Early Market",
            phase_description: "Target technology enthusiasts and early adopters",
            duration_weeks: 8,
            key_objectives: ["Build product awareness", "Gather feedback", "Establish thought leadership"]
          },
          {
            phase_number: 2,
            phase_name: "Chasm Crossing",
            phase_description: "Create compelling value for mainstream market",
            duration_weeks: 12,
            key_objectives: ["Develop case studies", "Build partnerships", "Refine value proposition"]
          }
        ]
      },
      mckinsey_7s: {
        framework_elements: {
          strategy: "Clear market positioning and competitive differentiation strategy",
          structure: "Organizational design to support go-to-market execution",
          systems: "Sales, marketing, and customer success systems and processes",
          shared_values: "Company culture and values that drive market success",
          style: "Leadership approach and management style for market penetration",
          staff: "Team capabilities and talent requirements for market entry",
          skills: "Core competencies needed to compete effectively"
        },
        phases: [
          {
            phase_number: 1,
            phase_name: "Strategic Alignment",
            phase_description: "Align all 7S elements for market entry",
            duration_weeks: 6,
            key_objectives: ["Define strategy", "Design structure", "Implement systems"]
          }
        ]
      },
      kotler_4p: {
        framework_elements: {
          product: "Core features, benefits, and differentiation of your offering",
          price: "Pricing strategy, models, and competitive positioning",
          place: "Distribution channels and market access strategies",
          promotion: "Marketing communications and promotional tactics"
        },
        phases: [
          {
            phase_number: 1,
            phase_name: "4P Strategy Development",
            phase_description: "Define product, price, place, and promotion strategies",
            duration_weeks: 4,
            key_objectives: ["Product positioning", "Pricing strategy", "Channel strategy", "Promotion plan"]
          }
        ]
      },
      lean_canvas: {
        framework_elements: {
          problem: "Key problems your product solves for target customers",
          solution: "Core features and value proposition of your product",
          key_metrics: "Critical success metrics to track progress",
          unfair_advantage: "Competitive advantages that cannot be easily copied",
          customer_segments: "Target customer groups and their characteristics",
          channels: "How you will reach and deliver to customers",
          cost_structure: "Key costs and investments required",
          revenue_streams: "How you will generate revenue from customers"
        },
        phases: [
          {
            phase_number: 1,
            phase_name: "Problem-Solution Fit",
            phase_description: "Validate problem and solution fit with target market",
            duration_weeks: 4,
            key_objectives: ["Validate problem", "Test solution", "Define metrics"]
          }
        ]
      }
    };

    const selectedFramework = frameworkData[framework as keyof typeof frameworkData] || frameworkData.crossing_chasm;

    const gtmPlan = {
      framework_name: framework,
      executive_summary: `Comprehensive go-to-market strategy for ${product_data.name} using the ${framework.replace('_', ' ')} framework. This strategy focuses on systematic market entry with clear phases, measurable objectives, and risk mitigation approaches tailored to ${product_data.target_market} and competitive landscape. ${product_data.value_proposition ? 'Key value proposition: ' + product_data.value_proposition : ''}`,
      product_focus: product_data.name,
      ...selectedFramework,
      w5h1_analysis: {
        who: `${product_data.target_market || 'Technology-forward businesses'} - specifically ${getSpecificTargetAudience(product_data)}. These are decision-makers who ${getAudiencePainPoints(product_data)}`,
        what: `Launch ${product_data.name} as ${getCategoryPositioning(product_data)} that ${product_data.description}. Core value: ${product_data.value_proposition || 'Revolutionary efficiency improvements'}. Key differentiators: ${product_data.key_features?.slice(0, 3).join(', ') || 'Advanced capabilities'}`,
        where: `${getOptimalMarkets(product_data)} - targeting ${getSpecificGeography(product_data)} where ${getMarketConditions(product_data)}`,
        when: `${getLaunchTiming(product_data)} with strategic rollout: ${getPhaseStrategy(product_data)}`,
        why: `${getMarketOpportunity(product_data)} creates urgent need for ${product_data.name}. Competitive advantage: ${product_data.competitive_advantage || 'First-mover advantage'} allows us to ${getRevenueOpportunity(product_data)}`,
        how: `${getChannelStrategy(product_data)} leveraging ${product_data.pricing_model || 'value-based pricing'} model. Implementation: ${getImplementationStrategy(product_data)}`
      },
      market_analysis: {
        market_size: "$2.5B total addressable market with 15% annual growth",
        target_segments: [
          {
            name: product_data.target_market || "Enterprise Technology Adopters",
            size: "40% of target market",
            characteristics: product_data.description ? `Businesses seeking ${product_data.description.toLowerCase()}` : "Forward-thinking organizations ready for innovation",
            pain_points: "Current solutions lack efficiency and integration capabilities"
          },
          {
            name: "Mid-Market Innovators", 
            size: "35% of target market",
            characteristics: "Growing companies with technology budgets seeking competitive advantages",
            pain_points: product_data.competitive_advantage ? `Need for ${product_data.competitive_advantage.toLowerCase()}` : "Limited by legacy systems and manual processes"
          }
        ],
        competitive_landscape: {
          direct_competitors: ["Market Leader A", "Established Player B"],
          indirect_competitors: ["Adjacent Solution C", "Legacy Provider D"],
          competitive_advantages: product_data.competitive_advantage ? [product_data.competitive_advantage, "Superior user experience", "Faster implementation"] : ["Innovative approach", "Superior user experience", "Faster implementation"]
        }
      },
      launch_timeline: [
        {
          phase: "Pre-Launch Preparation",
          timeline: "Weeks 1-4",
          activities: [
            "Finalize product positioning and messaging",
            "Develop marketing materials and sales tools",
            "Train sales and customer success teams",
            "Set up analytics and tracking systems"
          ]
        },
        {
          phase: "Soft Launch",
          timeline: "Weeks 5-8",
          activities: [
            "Launch with select customers and partners",
            "Gather feedback and iterate on product",
            "Refine sales process and pricing",
            "Build case studies and testimonials"
          ]
        },
        {
          phase: "Market Entry",
          timeline: "Weeks 9-16",
          activities: [
            "Full market launch with marketing campaigns",
            "Scale sales and marketing efforts",
            "Expand partnership network",
            "Monitor metrics and optimize performance"
          ]
        },
        {
          phase: "Growth & Scale",
          timeline: "Weeks 17-24",
          activities: [
            "Accelerate customer acquisition",
            "Enter new market segments",
            "Enhance product based on market feedback",
            "Plan international expansion"
          ]
        }
      ],
      success_metrics: {
        customer_acquisition: [
          "Monthly new customer sign-ups",
          "Customer acquisition cost (CAC)",
          "Time to first value for customers",
          "Customer onboarding completion rate"
        ],
        revenue_metrics: [
          "Monthly recurring revenue (MRR)",
          "Average revenue per user (ARPU)",
          "Revenue growth rate",
          "Customer lifetime value (CLV)"
        ],
        market_penetration: [
          "Market share percentage",
          "Brand awareness metrics",
          "Competitive win rate",
          "Market reach and coverage"
        ],
        operational_metrics: [
          "Sales cycle length",
          "Lead conversion rates",
          "Customer satisfaction (NPS)",
          "Product adoption rates"
        ]
      }
    };

    return NextResponse.json(gtmPlan);
  } catch (error) {
    console.error('Error generating GTM plan:', error);
    return NextResponse.json(
      { error: 'Failed to generate GTM plan' },
      { status: 500 }
    );
  }
}