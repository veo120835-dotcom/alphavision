// Suitability Guard - Ensures trades match investor profile

interface InvestorProfile {
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  investmentHorizon: 'short' | 'medium' | 'long';
  experience: 'beginner' | 'intermediate' | 'advanced';
  objectives: ('income' | 'growth' | 'speculation' | 'preservation')[];
  restrictions: string[];
}

interface AssetProfile {
  symbol: string;
  riskLevel: 'low' | 'medium' | 'high' | 'very_high';
  assetClass: string;
  suitableFor: InvestorProfile['riskTolerance'][];
  requiresExperience: InvestorProfile['experience'];
  category: string;
}

interface SuitabilityCheck {
  suitable: boolean;
  warnings: string[];
  overrideRequired: boolean;
}

class SuitabilityGuard {
  private investorProfile: InvestorProfile = {
    riskTolerance: 'moderate',
    investmentHorizon: 'medium',
    experience: 'intermediate',
    objectives: ['growth'],
    restrictions: []
  };

  private assetProfiles: Map<string, AssetProfile> = new Map();

  setInvestorProfile(profile: InvestorProfile): void {
    this.investorProfile = profile;
  }

  registerAsset(profile: AssetProfile): void {
    this.assetProfiles.set(profile.symbol, profile);
  }

  check(symbol: string, quantity: number, portfolioValue: number): SuitabilityCheck {
    const warnings: string[] = [];
    let overrideRequired = false;

    const asset = this.assetProfiles.get(symbol);
    
    if (!asset) {
      warnings.push('Asset profile not registered - proceeding with caution');
      return { suitable: true, warnings, overrideRequired: false };
    }

    // Check risk tolerance match
    if (!asset.suitableFor.includes(this.investorProfile.riskTolerance)) {
      warnings.push(`Asset risk level (${asset.riskLevel}) may not match your risk tolerance (${this.investorProfile.riskTolerance})`);
      if (asset.riskLevel === 'very_high' && this.investorProfile.riskTolerance === 'conservative') {
        overrideRequired = true;
      }
    }

    // Check experience level
    const experienceLevels = ['beginner', 'intermediate', 'advanced'];
    const requiredExp = experienceLevels.indexOf(asset.requiresExperience);
    const actualExp = experienceLevels.indexOf(this.investorProfile.experience);
    
    if (actualExp < requiredExp) {
      warnings.push(`This asset typically requires ${asset.requiresExperience} experience`);
      overrideRequired = true;
    }

    // Check concentration
    const tradeValue = quantity * 100; // Simplified price estimate
    const concentration = tradeValue / portfolioValue;
    
    if (concentration > 0.2) {
      warnings.push(`This trade would represent ${(concentration * 100).toFixed(1)}% of your portfolio`);
      if (concentration > 0.5) {
        overrideRequired = true;
      }
    }

    // Check restrictions
    if (this.investorProfile.restrictions.includes(symbol)) {
      warnings.push('This asset is on your personal restriction list');
      overrideRequired = true;
    }

    return {
      suitable: warnings.length === 0,
      warnings,
      overrideRequired
    };
  }

  getProfile(): InvestorProfile {
    return { ...this.investorProfile };
  }

  // Pre-built profiles for common asset types
  registerCommonAssets(): void {
    const commonAssets: AssetProfile[] = [
      { symbol: 'SPY', riskLevel: 'medium', assetClass: 'equity', suitableFor: ['conservative', 'moderate', 'aggressive'], requiresExperience: 'beginner', category: 'etf' },
      { symbol: 'QQQ', riskLevel: 'medium', assetClass: 'equity', suitableFor: ['moderate', 'aggressive'], requiresExperience: 'beginner', category: 'etf' },
      { symbol: 'BTC', riskLevel: 'very_high', assetClass: 'crypto', suitableFor: ['aggressive'], requiresExperience: 'advanced', category: 'crypto' },
      { symbol: 'TQQQ', riskLevel: 'very_high', assetClass: 'equity', suitableFor: ['aggressive'], requiresExperience: 'advanced', category: 'leveraged_etf' },
    ];

    commonAssets.forEach(asset => this.registerAsset(asset));
  }
}

export const suitabilityGuard = new SuitabilityGuard();
