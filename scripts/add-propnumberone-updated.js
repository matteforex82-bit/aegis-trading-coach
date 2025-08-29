const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();

// Template PropNumberOne con regole specifiche dalla tabella tecnica
const propNumberOneTemplates = {
  propFirmName: "PropNumberOne",
  description: "Prop trading firm con regole di protezione 50% e consistency protection",
  website: "https://propnumberone.com",
  templates: [
    {
      name: "PropNumberOne Challenge 7k",
      accountSize: 7000,
      currency: "USD",
      rulesJson: {
        // FASE 1: Evaluation
        profitTargets: {
          PHASE_1: {
            percentage: 8,
            amount: 560, // 8% of 7000
            description: "Raggiungere un profitto pari all'8% del saldo iniziale",
            isRequired: true
          },
          PHASE_2: {
            percentage: 5,
            amount: 350, // 5% of 7000
            description: "Raggiungere un profitto pari al 5% del saldo iniziale",
            isRequired: true
          },
          FUNDED: {
            percentage: null,
            amount: null,
            description: "Nessun target di profitto per il conto Funded",
            isRequired: false
          }
        },
        
        // Max Daily Loss - 5% del saldo di fine giornata precedente
        dailyLossLimits: {
          PHASE_1: {
            percentage: 5,
            amount: 350, // 5% of 7000 (initial calculation)
            description: "La perdita massima in un singolo giorno non deve superare il 5% del saldo di fine giornata precedente",
            isBreachable: true,
            breachConsequence: "Fallimento immediato",
            calculationMethod: "previous_day_end_balance"
          },
          PHASE_2: {
            percentage: 5,
            amount: 350,
            description: "La perdita massima in un singolo giorno non deve superare il 5% del saldo di fine giornata precedente",
            isBreachable: true,
            breachConsequence: "Fallimento immediato",
            calculationMethod: "previous_day_end_balance"
          },
          FUNDED: {
            percentage: 5,
            amount: 350,
            description: "La perdita massima in un singolo giorno non deve superare il 5% del saldo di fine giornata precedente",
            isBreachable: true,
            breachConsequence: "Perdita del conto",
            calculationMethod: "previous_day_end_balance"
          }
        },
        
        // Max Overall Loss - 10% del saldo iniziale
        overallLossLimits: {
          PHASE_1: {
            percentage: 10,
            amount: 700, // 10% of 7000
            description: "La perdita totale dal saldo iniziale non deve mai superare il 10%",
            isBreachable: true,
            breachConsequence: "Fallimento immediato",
            calculationMethod: "initial_balance"
          },
          PHASE_2: {
            percentage: 10,
            amount: 700,
            description: "La perdita totale dal saldo iniziale non deve mai superare il 10%",
            isBreachable: true,
            breachConsequence: "Fallimento immediato",
            calculationMethod: "initial_balance"
          },
          FUNDED: {
            percentage: 10,
            amount: 700,
            description: "La perdita totale dal saldo iniziale non deve mai superare il 10%",
            isBreachable: true,
            breachConsequence: "Perdita del conto",
            calculationMethod: "initial_balance"
          }
        },
        
        // Minimum Trading Days
        minimumTradingDays: {
          PHASE_1: {
            days: 5,
            description: "Aprire almeno un trade in 5 giorni di trading distinti",
            isRequired: true
          },
          PHASE_2: {
            days: 5,
            description: "Aprire almeno un trade in 5 giorni di trading distinti",
            isRequired: true
          },
          FUNDED: {
            days: 0,
            description: "Nessun requisito di giorni minimi per il conto Funded",
            isRequired: false
          }
        },
        
        // Regole di Protezione 50% (Solo Fase 2 e Funded)
        consistencyRules: {
          PHASE_1: {
            enabled: false,
            description: "Nessuna regola di consistenza nella Fase 1"
          },
          PHASE_2: {
            enabled: true,
            description: "Regole di protezione 50% attive",
            rules: [
              {
                name: "50% Daily Protection",
                type: "daily_protection",
                description: "Il profitto totale deve essere ≥ al doppio del profitto del giorno migliore",
                formula: "Profitto Totale ≥ (Profitto Giorno Migliore * 2)",
                isRequired: true
              },
              {
                name: "50% Trade Protection",
                type: "trade_protection",
                description: "Il profitto totale deve essere ≥ al doppio del profitto del trade migliore",
                formula: "Profitto Totale ≥ (Profitto Trade Migliore * 2)",
                isRequired: true
              }
            ]
          },
          FUNDED: {
            enabled: true,
            description: "Regole di protezione 50% attive per il conto Funded",
            rules: [
              {
                name: "50% Daily Protection",
                type: "daily_protection",
                description: "Il profitto totale deve essere ≥ al doppio del profitto del giorno migliore",
                formula: "Profitto Totale ≥ (Profitto Giorno Migliore * 2)",
                isRequired: true
              },
              {
                name: "50% Trade Protection",
                type: "trade_protection",
                description: "Il profitto totale deve essere ≥ al doppio del profitto del trade migliore",
                formula: "Profitto Totale ≥ (Profitto Trade Migliore * 2)",
                isRequired: true
              }
            ]
          }
        },
        
        // Informazioni sui prelievi
        payoutInfo: {
          profitSplit: {
            trader: 80,
            propFirm: 20,
            description: "80% dei profitti spettano al trader"
          },
          firstPayoutAfterDays: 30,
          payoutFrequencyDays: 15,
          description: "Primo prelievo dopo 30 giorni, successivi ogni 15 giorni"
        },
        
        // Restrizioni di trading
        tradingRestrictions: {
          newsTrading: true,
          expertAdvisors: true,
          copyTrading: true,
          weekendTrading: true,
          weekendHolding: true,
          hedging: true,
          martingale: false,
          description: "Flessibilità di trading con regole di protezione"
        },
        
        // Caratteristiche speciali
        specialFeatures: [
          "Regole di protezione 50% (Daily e Trade Protection)",
          "Max Daily Loss calcolato sul saldo di fine giornata precedente",
          "Max Overall Loss fisso al 10% del saldo iniziale",
          "5 giorni minimi di trading nelle fasi Challenge",
          "Profit split 80% trader / 20% prop firm",
          "Prelievi ogni 15 giorni dopo il primo"
        ]
      }
    },
    
    // Template per altre size
    {
      name: "PropNumberOne Challenge 17k",
      accountSize: 17000,
      currency: "USD",
      rulesJson: {
        profitTargets: {
          PHASE_1: { percentage: 8, amount: 1360, description: "8% del saldo iniziale", isRequired: true },
          PHASE_2: { percentage: 5, amount: 850, description: "5% del saldo iniziale", isRequired: true },
          FUNDED: { percentage: null, amount: null, description: "Nessun target", isRequired: false }
        },
        dailyLossLimits: {
          PHASE_1: { percentage: 5, amount: 850, description: "5% del saldo di fine giornata precedente", isBreachable: true, breachConsequence: "Fallimento", calculationMethod: "previous_day_end_balance" },
          PHASE_2: { percentage: 5, amount: 850, description: "5% del saldo di fine giornata precedente", isBreachable: true, breachConsequence: "Fallimento", calculationMethod: "previous_day_end_balance" },
          FUNDED: { percentage: 5, amount: 850, description: "5% del saldo di fine giornata precedente", isBreachable: true, breachConsequence: "Perdita conto", calculationMethod: "previous_day_end_balance" }
        },
        overallLossLimits: {
          PHASE_1: { percentage: 10, amount: 1700, description: "10% del saldo iniziale", isBreachable: true, breachConsequence: "Fallimento", calculationMethod: "initial_balance" },
          PHASE_2: { percentage: 10, amount: 1700, description: "10% del saldo iniziale", isBreachable: true, breachConsequence: "Fallimento", calculationMethod: "initial_balance" },
          FUNDED: { percentage: 10, amount: 1700, description: "10% del saldo iniziale", isBreachable: true, breachConsequence: "Perdita conto", calculationMethod: "initial_balance" }
        },
        minimumTradingDays: {
          PHASE_1: { days: 5, description: "5 giorni di trading distinti", isRequired: true },
          PHASE_2: { days: 5, description: "5 giorni di trading distinti", isRequired: true },
          FUNDED: { days: 0, description: "Nessun requisito", isRequired: false }
        },
        consistencyRules: {
          PHASE_1: { enabled: false, description: "Nessuna regola di consistenza" },
          PHASE_2: { enabled: true, description: "Regole di protezione 50%", rules: [{ name: "50% Daily Protection", type: "daily_protection", formula: "Profitto Totale ≥ (Profitto Giorno Migliore * 2)" }, { name: "50% Trade Protection", type: "trade_protection", formula: "Profitto Totale ≥ (Profitto Trade Migliore * 2)" }] },
          FUNDED: { enabled: true, description: "Regole di protezione 50%", rules: [{ name: "50% Daily Protection", type: "daily_protection", formula: "Profitto Totale ≥ (Profitto Giorno Migliore * 2)" }, { name: "50% Trade Protection", type: "trade_protection", formula: "Profitto Totale ≥ (Profitto Trade Migliore * 2)" }] }
        },
        payoutInfo: { profitSplit: { trader: 80, propFirm: 20 }, firstPayoutAfterDays: 30, payoutFrequencyDays: 15 },
        tradingRestrictions: { newsTrading: true, expertAdvisors: true, weekendHolding: true },
        specialFeatures: ["Regole di protezione 50%", "Max Daily Loss dinamico"]
      }
    },
    
    {
      name: "PropNumberOne Challenge 27k",
      accountSize: 27000,
      currency: "USD",
      rulesJson: {
        profitTargets: {
          PHASE_1: { percentage: 8, amount: 2160, description: "8% del saldo iniziale", isRequired: true },
          PHASE_2: { percentage: 5, amount: 1350, description: "5% del saldo iniziale", isRequired: true },
          FUNDED: { percentage: null, amount: null, description: "Nessun target", isRequired: false }
        },
        dailyLossLimits: {
          PHASE_1: { percentage: 5, amount: 1350, description: "5% del saldo di fine giornata precedente", isBreachable: true, breachConsequence: "Fallimento", calculationMethod: "previous_day_end_balance" },
          PHASE_2: { percentage: 5, amount: 1350, description: "5% del saldo di fine giornata precedente", isBreachable: true, breachConsequence: "Fallimento", calculationMethod: "previous_day_end_balance" },
          FUNDED: { percentage: 5, amount: 1350, description: "5% del saldo di fine giornata precedente", isBreachable: true, breachConsequence: "Perdita conto", calculationMethod: "previous_day_end_balance" }
        },
        overallLossLimits: {
          PHASE_1: { percentage: 10, amount: 2700, description: "10% del saldo iniziale", isBreachable: true, breachConsequence: "Fallimento", calculationMethod: "initial_balance" },
          PHASE_2: { percentage: 10, amount: 2700, description: "10% del saldo iniziale", isBreachable: true, breachConsequence: "Fallimento", calculationMethod: "initial_balance" },
          FUNDED: { percentage: 10, amount: 2700, description: "10% del saldo iniziale", isBreachable: true, breachConsequence: "Perdita conto", calculationMethod: "initial_balance" }
        },
        minimumTradingDays: {
          PHASE_1: { days: 5, description: "5 giorni di trading distinti", isRequired: true },
          PHASE_2: { days: 5, description: "5 giorni di trading distinti", isRequired: true },
          FUNDED: { days: 0, description: "Nessun requisito", isRequired: false }
        },
        consistencyRules: {
          PHASE_1: { enabled: false, description: "Nessuna regola di consistenza" },
          PHASE_2: { enabled: true, description: "Regole di protezione 50%", rules: [{ name: "50% Daily Protection", type: "daily_protection", formula: "Profitto Totale ≥ (Profitto Giorno Migliore * 2)" }, { name: "50% Trade Protection", type: "trade_protection", formula: "Profitto Totale ≥ (Profitto Trade Migliore * 2)" }] },
          FUNDED: { enabled: true, description: "Regole di protezione 50%", rules: [{ name: "50% Daily Protection", type: "daily_protection", formula: "Profitto Totale ≥ (Profitto Giorno Migliore * 2)" }, { name: "50% Trade Protection", type: "trade_protection", formula: "Profitto Totale ≥ (Profitto Trade Migliore * 2)" }] }
        },
        payoutInfo: { profitSplit: { trader: 80, propFirm: 20 }, firstPayoutAfterDays: 30, payoutFrequencyDays: 15 },
        tradingRestrictions: { newsTrading: true, expertAdvisors: true, weekendHolding: true },
        specialFeatures: ["Regole di protezione 50%", "Max Daily Loss dinamico"]
      }
    },
    
    {
      name: "PropNumberOne Challenge 50k",
      accountSize: 50000,
      currency: "USD",
      rulesJson: {
        profitTargets: {
          PHASE_1: { percentage: 8, amount: 4000, description: "8% del saldo iniziale", isRequired: true },
          PHASE_2: { percentage: 5, amount: 2500, description: "5% del saldo iniziale", isRequired: true },
          FUNDED: { percentage: null, amount: null, description: "Nessun target", isRequired: false }
        },
        dailyLossLimits: {
          PHASE_1: { percentage: 5, amount: 2500, description: "5% del saldo di fine giornata precedente", isBreachable: true, breachConsequence: "Fallimento", calculationMethod: "previous_day_end_balance" },
          PHASE_2: { percentage: 5, amount: 2500, description: "5% del saldo di fine giornata precedente", isBreachable: true, breachConsequence: "Fallimento", calculationMethod: "previous_day_end_balance" },
          FUNDED: { percentage: 5, amount: 2500, description: "5% del saldo di fine giornata precedente", isBreachable: true, breachConsequence: "Perdita conto", calculationMethod: "previous_day_end_balance" }
        },
        overallLossLimits: {
          PHASE_1: { percentage: 10, amount: 5000, description: "10% del saldo iniziale", isBreachable: true, breachConsequence: "Fallimento", calculationMethod: "initial_balance" },
          PHASE_2: { percentage: 10, amount: 5000, description: "10% del saldo iniziale", isBreachable: true, breachConsequence: "Fallimento", calculationMethod: "initial_balance" },
          FUNDED: { percentage: 10, amount: 5000, description: "10% del saldo iniziale", isBreachable: true, breachConsequence: "Perdita conto", calculationMethod: "initial_balance" }
        },
        minimumTradingDays: {
          PHASE_1: { days: 5, description: "5 giorni di trading distinti", isRequired: true },
          PHASE_2: { days: 5, description: "5 giorni di trading distinti", isRequired: true },
          FUNDED: { days: 0, description: "Nessun requisito", isRequired: false }
        },
        consistencyRules: {
          PHASE_1: { enabled: false, description: "Nessuna regola di consistenza" },
          PHASE_2: { enabled: true, description: "Regole di protezione 50%", rules: [{ name: "50% Daily Protection", type: "daily_protection", formula: "Profitto Totale ≥ (Profitto Giorno Migliore * 2)" }, { name: "50% Trade Protection", type: "trade_protection", formula: "Profitto Totale ≥ (Profitto Trade Migliore * 2)" }] },
          FUNDED: { enabled: true, description: "Regole di protezione 50%", rules: [{ name: "50% Daily Protection", type: "daily_protection", formula: "Profitto Totale ≥ (Profitto Giorno Migliore * 2)" }, { name: "50% Trade Protection", type: "trade_protection", formula: "Profitto Totale ≥ (Profitto Trade Migliore * 2)" }] }
        },
        payoutInfo: { profitSplit: { trader: 80, propFirm: 20 }, firstPayoutAfterDays: 30, payoutFrequencyDays: 15 },
        tradingRestrictions: { newsTrading: true, expertAdvisors: true, weekendHolding: true },
        specialFeatures: ["Regole di protezione 50%", "Max Daily Loss dinamico"]
      }
    },
    
    {
      name: "PropNumberOne Challenge 100k",
      accountSize: 100000,
      currency: "USD",
      rulesJson: {
        profitTargets: {
          PHASE_1: { percentage: 8, amount: 8000, description: "8% del saldo iniziale", isRequired: true },
          PHASE_2: { percentage: 5, amount: 5000, description: "5% del saldo iniziale", isRequired: true },
          FUNDED: { percentage: null, amount: null, description: "Nessun target", isRequired: false }
        },
        dailyLossLimits: {
          PHASE_1: { percentage: 5, amount: 5000, description: "5% del saldo di fine giornata precedente", isBreachable: true, breachConsequence: "Fallimento", calculationMethod: "previous_day_end_balance" },
          PHASE_2: { percentage: 5, amount: 5000, description: "5% del saldo di fine giornata precedente", isBreachable: true, breachConsequence: "Fallimento", calculationMethod: "previous_day_end_balance" },
          FUNDED: { percentage: 5, amount: 5000, description: "5% del saldo di fine giornata precedente", isBreachable: true, breachConsequence: "Perdita conto", calculationMethod: "previous_day_end_balance" }
        },
        overallLossLimits: {
          PHASE_1: { percentage: 10, amount: 10000, description: "10% del saldo iniziale", isBreachable: true, breachConsequence: "Fallimento", calculationMethod: "initial_balance" },
          PHASE_2: { percentage: 10, amount: 10000, description: "10% del saldo iniziale", isBreachable: true, breachConsequence: "Fallimento", calculationMethod: "initial_balance" },
          FUNDED: { percentage: 10, amount: 10000, description: "10% del saldo iniziale", isBreachable: true, breachConsequence: "Perdita conto", calculationMethod: "initial_balance" }
        },
        minimumTradingDays: {
          PHASE_1: { days: 5, description: "5 giorni di trading distinti", isRequired: true },
          PHASE_2: { days: 5, description: "5 giorni di trading distinti", isRequired: true },
          FUNDED: { days: 0, description: "Nessun requisito", isRequired: false }
        },
        consistencyRules: {
          PHASE_1: { enabled: false, description: "Nessuna regola di consistenza" },
          PHASE_2: { enabled: true, description: "Regole di protezione 50%", rules: [{ name: "50% Daily Protection", type: "daily_protection", formula: "Profitto Totale ≥ (Profitto Giorno Migliore * 2)" }, { name: "50% Trade Protection", type: "trade_protection", formula: "Profitto Totale ≥ (Profitto Trade Migliore * 2)" }] },
          FUNDED: { enabled: true, description: "Regole di protezione 50%", rules: [{ name: "50% Daily Protection", type: "daily_protection", formula: "Profitto Totale ≥ (Profitto Giorno Migliore * 2)" }, { name: "50% Trade Protection", type: "trade_protection", formula: "Profitto Totale ≥ (Profitto Trade Migliore * 2)" }] }
        },
        payoutInfo: { profitSplit: { trader: 80, propFirm: 20 }, firstPayoutAfterDays: 30, payoutFrequencyDays: 15 },
        tradingRestrictions: { newsTrading: true, expertAdvisors: true, weekendHolding: true },
        specialFeatures: ["Regole di protezione 50%", "Max Daily Loss dinamico"]
      }
    },
    
    {
      name: "PropNumberOne Challenge 200k",
      accountSize: 200000,
      currency: "USD",
      rulesJson: {
        profitTargets: {
          PHASE_1: { percentage: 8, amount: 16000, description: "8% del saldo iniziale", isRequired: true },
          PHASE_2: { percentage: 5, amount: 10000, description: "5% del saldo iniziale", isRequired: true },
          FUNDED: { percentage: null, amount: null, description: "Nessun target", isRequired: false }
        },
        dailyLossLimits: {
          PHASE_1: { percentage: 5, amount: 10000, description: "5% del saldo di fine giornata precedente", isBreachable: true, breachConsequence: "Fallimento", calculationMethod: "previous_day_end_balance" },
          PHASE_2: { percentage: 5, amount: 10000, description: "5% del saldo di fine giornata precedente", isBreachable: true, breachConsequence: "Fallimento", calculationMethod: "previous_day_end_balance" },
          FUNDED: { percentage: 5, amount: 10000, description: "5% del saldo di fine giornata precedente", isBreachable: true, breachConsequence: "Perdita conto", calculationMethod: "previous_day_end_balance" }
        },
        overallLossLimits: {
          PHASE_1: { percentage: 10, amount: 20000, description: "10% del saldo iniziale", isBreachable: true, breachConsequence: "Fallimento", calculationMethod: "initial_balance" },
          PHASE_2: { percentage: 10, amount: 20000, description: "10% del saldo iniziale", isBreachable: true, breachConsequence: "Fallimento", calculationMethod: "initial_balance" },
          FUNDED: { percentage: 10, amount: 20000, description: "10% del saldo iniziale", isBreachable: true, breachConsequence: "Perdita conto", calculationMethod: "initial_balance" }
        },
        minimumTradingDays: {
          PHASE_1: { days: 5, description: "5 giorni di trading distinti", isRequired: true },
          PHASE_2: { days: 5, description: "5 giorni di trading distinti", isRequired: true },
          FUNDED: { days: 0, description: "Nessun requisito", isRequired: false }
        },
        consistencyRules: {
          PHASE_1: { enabled: false, description: "Nessuna regola di consistenza" },
          PHASE_2: { enabled: true, description: "Regole di protezione 50%", rules: [{ name: "50% Daily Protection", type: "daily_protection", formula: "Profitto Totale ≥ (Profitto Giorno Migliore * 2)" }, { name: "50% Trade Protection", type: "trade_protection", formula: "Profitto Totale ≥ (Profitto Trade Migliore * 2)" }] },
          FUNDED: { enabled: true, description: "Regole di protezione 50%", rules: [{ name: "50% Daily Protection", type: "daily_protection", formula: "Profitto Totale ≥ (Profitto Giorno Migliore * 2)" }, { name: "50% Trade Protection", type: "trade_protection", formula: "Profitto Totale ≥ (Profitto Trade Migliore * 2)" }] }
        },
        payoutInfo: { profitSplit: { trader: 80, propFirm: 20 }, firstPayoutAfterDays: 30, payoutFrequencyDays: 15 },
        tradingRestrictions: { newsTrading: true, expertAdvisors: true, weekendHolding: true },
        specialFeatures: ["Regole di protezione 50%", "Max Daily Loss dinamico"]
      }
    },
    
    {
      name: "PropNumberOne Challenge 300k",
      accountSize: 300000,
      currency: "USD",
      rulesJson: {
        profitTargets: {
          PHASE_1: { percentage: 8, amount: 24000, description: "8% del saldo iniziale", isRequired: true },
          PHASE_2: { percentage: 5, amount: 15000, description: "5% del saldo iniziale", isRequired: true },
          FUNDED: { percentage: null, amount: null, description: "Nessun target", isRequired: false }
        },
        dailyLossLimits: {
          PHASE_1: { percentage: 5, amount: 15000, description: "5% del saldo di fine giornata precedente", isBreachable: true, breachConsequence: "Fallimento", calculationMethod: "previous_day_end_balance" },
          PHASE_2: { percentage: 5, amount: 15000, description: "5% del saldo di fine giornata precedente", isBreachable: true, breachConsequence: "Fallimento", calculationMethod: "previous_day_end_balance" },
          FUNDED: { percentage: 5, amount: 15000, description: "5% del saldo di fine giornata precedente", isBreachable: true, breachConsequence: "Perdita conto", calculationMethod: "previous_day_end_balance" }
        },
        overallLossLimits: {
          PHASE_1: { percentage: 10, amount: 30000, description: "10% del saldo iniziale", isBreachable: true, breachConsequence: "Fallimento", calculationMethod: "initial_balance" },
          PHASE_2: { percentage: 10, amount: 30000, description: "10% del saldo iniziale", isBreachable: true, breachConsequence: "Fallimento", calculationMethod: "initial_balance" },
          FUNDED: { percentage: 10, amount: 30000, description: "10% del saldo iniziale", isBreachable: true, breachConsequence: "Perdita conto", calculationMethod: "initial_balance" }
        },
        minimumTradingDays: {
          PHASE_1: { days: 5, description: "5 giorni di trading distinti", isRequired: true },
          PHASE_2: { days: 5, description: "5 giorni di trading distinti", isRequired: true },
          FUNDED: { days: 0, description: "Nessun requisito", isRequired: false }
        },
        consistencyRules: {
          PHASE_1: { enabled: false, description: "Nessuna regola di consistenza" },
          PHASE_2: { enabled: true, description: "Regole di protezione 50%", rules: [{ name: "50% Daily Protection", type: "daily_protection", formula: "Profitto Totale ≥ (Profitto Giorno Migliore * 2)" }, { name: "50% Trade Protection", type: "trade_protection", formula: "Profitto Totale ≥ (Profitto Trade Migliore * 2)" }] },
          FUNDED: { enabled: true, description: "Regole di protezione 50%", rules: [{ name: "50% Daily Protection", type: "daily_protection", formula: "Profitto Totale ≥ (Profitto Giorno Migliore * 2)" }, { name: "50% Trade Protection", type: "trade_protection", formula: "Profitto Totale ≥ (Profitto Trade Migliore * 2)" }] }
        },
        payoutInfo: { profitSplit: { trader: 80, propFirm: 20 }, firstPayoutAfterDays: 30, payoutFrequencyDays: 15 },
        tradingRestrictions: { newsTrading: true, expertAdvisors: true, weekendHolding: true },
        specialFeatures: ["Regole di protezione 50%", "Max Daily Loss dinamico"]
      }
    }
  ]
};

async function addPropNumberOneTemplates() {
  try {
    console.log('🚀 Adding PropNumberOne templates...\n');

    const firmData = propNumberOneTemplates;
    
    // Find or create PropFirm
    let propFirm = await db.propFirm.findFirst({
      where: { name: firmData.propFirmName }
    });

    if (!propFirm) {
      console.log(`🔄 Creating PropFirm: ${firmData.propFirmName}`);
      propFirm = await db.propFirm.create({
        data: {
          name: firmData.propFirmName,
          description: firmData.description,
          website: firmData.website,
          isActive: true,
          defaultRules: firmData.templates[3].rulesJson // Use 50k as default
        }
      });
    }

    console.log(`✅ PropFirm ID: ${propFirm.id}`);
    console.log(`📋 PropFirm: ${propFirm.name}\n`);

    // Create templates
    for (const template of firmData.templates) {
      try {
        // Check if template already exists
        const existingTemplate = await db.propFirmTemplate.findFirst({
          where: {
            propFirmId: propFirm.id,
            name: template.name
          }
        });

        if (existingTemplate) {
          console.log(`⚠️  Template already exists: ${template.name}`);
          continue;
        }

        const createdTemplate = await db.propFirmTemplate.create({
          data: {
            name: template.name,
            propFirmId: propFirm.id,
            accountSize: template.accountSize,
            currency: template.currency,
            rulesJson: template.rulesJson,
            isActive: true
          }
        });

        console.log(`✅ Created template: ${template.name} ($${template.accountSize.toLocaleString()} ${template.currency})`);
        
        // Show key rules for verification
        const rules = template.rulesJson;
        console.log(`   🎯 Phase 1 Target: ${rules.profitTargets.PHASE_1.percentage}% ($${rules.profitTargets.PHASE_1.amount.toLocaleString()})`);
        console.log(`   🎯 Phase 2 Target: ${rules.profitTargets.PHASE_2.percentage}% ($${rules.profitTargets.PHASE_2.amount.toLocaleString()})`);
        console.log(`   🚫 Max Daily Loss: ${rules.dailyLossLimits.PHASE_1.percentage}% (dinamico)`);
        console.log(`   🚫 Max Total Loss: ${rules.overallLossLimits.PHASE_1.percentage}% ($${rules.overallLossLimits.PHASE_1.amount.toLocaleString()})`);
        console.log(`   📅 Min Trading Days: ${rules.minimumTradingDays.PHASE_1.days}`);
        console.log(`   ⚖️  50% Protection: ${rules.consistencyRules.PHASE_2.enabled ? 'YES (Phase 2 & Funded)' : 'NO'}`);
        console.log(`   💰 Profit Split: ${rules.payoutInfo.profitSplit.trader}% trader`);
        console.log('');
        
      } catch (templateError) {
        console.error(`❌ Error creating template ${template.name}:`, templateError.message);
      }
    }

    // Summary
    const totalTemplates = await db.propFirmTemplate.count({
      where: { propFirmId: propFirm.id }
    });
    
    console.log('📈 SUMMARY:');
    console.log(`   PropFirm: ${propFirm.name}`);
    console.log(`   Templates Created: ${totalTemplates}`);
    console.log('\n🎯 PropNumberOne templates created successfully!');
    console.log('\n🌟 KEY FEATURES:');
    console.log('   ✅ 50% Daily Protection (Phase 2 & Funded)');
    console.log('   ✅ 50% Trade Protection (Phase 2 & Funded)');
    console.log('   ✅ Dynamic Max Daily Loss (5% of previous day end balance)');
    console.log('   ✅ Fixed Max Overall Loss (10% of initial balance)');
    console.log('   ✅ 5 Minimum Trading Days (Phase 1 & 2)');
    console.log('   ✅ 80% Profit Split');
    console.log('   ✅ Payouts every 15 days after first');

  } catch (error) {
    console.error('❌ Error adding PropNumberOne templates:', error);
  } finally {
    await db.$disconnect();
  }
}

addPropNumberOneTemplates();