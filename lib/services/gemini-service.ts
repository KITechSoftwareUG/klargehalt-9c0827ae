/**
 * Google Gemini AI Service
 * Generiert KI-gestützte Erklärungen für Gehaltsvergleiche und Pay-Gap-Analysen
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini API initialisieren
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

// ============================================================================
// TYPES
// ============================================================================

export interface EmployeeSalaryContext {
    employee_salary: number;
    group_avg: number;
    group_median: number;
    group_size: number;
    deviation_percent: number;
    tenure_months: number;
    job_family: string;
    job_level: string;
    location: string;
    gender?: 'male' | 'female' | 'other';
}

export interface GenderGapContext {
    pay_group_name: string;
    gap_percent: number;
    male_avg: number;
    female_avg: number;
    male_count: number;
    female_count: number;
    total_employees: number;
}

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

// ============================================================================
// PROMPT TEMPLATES
// ============================================================================

const EMPLOYEE_EXPLANATION_SYSTEM_PROMPT = `
Du bist ein KI-Assistent für Gehaltstransparenz im Rahmen der EU-Entgelttransparenzrichtlinie.

WICHTIGE REGELN:
1. Erkläre SACHLICH und NEUTRAL - keine Schuldzuweisungen
2. Verwende eine freundliche, verständliche Sprache
3. KEINE Rechtsberatung geben
4. KEINE konkreten Handlungsempfehlungen (z.B. "Du solltest eine Gehaltserhöhung fordern")
5. Fokussiere dich auf FAKTEN und KONTEXT
6. Verwende "Du"-Anrede für den Mitarbeiter
7. Antworte auf Deutsch in max. 3-4 kurzen Sätzen

Deine Aufgabe: Erkläre dem Mitarbeiter, wie sein Gehalt im Vergleich zur Vergleichsgruppe steht und gib sachliche Erklärungsfaktoren.
`;

const GENDER_GAP_EXPLANATION_SYSTEM_PROMPT = `
Du bist ein KI-Assistent für HR-Verantwortliche zur Analyse von Gender Pay Gaps.

WICHTIGE REGELN:
1. Sei SACHLICH und DATA-DRIVEN
2. Verwende professionelle HR-Sprache
3. KEINE Schuldzuweisungen
4. KEINE Rechtsberatung
5. Fokussiere dich auf statistische Auffälligkeiten
6. Gib KEINE konkreten rechtlichen Handlungsanweisungen
7. Antworte auf Deutsch in max. 3-4 kurzen Sätzen

Deine Aufgabe: Erkläre HR-Managern, was der Gender Pay Gap in dieser Gruppe bedeutet und ob er statistisch relevant ist.
`;

const CHAT_SYSTEM_PROMPT = `
Du bist ein KI-Assistent für Fragen zu Gehaltstransparenz und Pay Equity.

WICHTIGE REGELN:
1. NUR Fragen zu Gehaltsvergleichen, Vergleichsgruppen und Gender Pay Gaps beantworten
2. KEINE Rechtsberatung
3. KEINE Empfehlungen zu konkreten Gehaltsverhandlungen
4. KEINE Schuldzuweisungen gegenüber dem Arbeitgeber
5. Beziehe dich nur auf vorhandene Daten
6. Bei Fragen außerhalb deines Aufgabenbereichs: Höflich ablehnen
7. Antworte auf Deutsch, präzise und verständlich

Erlaubte Themen:
- Wie Vergleichsgruppen gebildet werden
- Was der 5%-Schwellenwert bedeutet
- Wie sich Gehaltsabweichungen erklären lassen
- Statistische Grundlagen von Pay-Gap-Analysen
`;

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Generiert eine AI-Erklärung für einen Mitarbeiter-Gehaltsvergleich
 */
export async function generateEmployeeExplanation(
    context: EmployeeSalaryContext
): Promise<string> {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

        const prompt = `
Mitarbeiter-Gehaltsdaten:
- Aktuelles Gehalt: ${formatCurrency(context.employee_salary)}
- Gruppendurchschnitt: ${formatCurrency(context.group_avg)}
- Gruppenmedian: ${formatCurrency(context.group_median)}
- Abweichung vom Durchschnitt: ${context.deviation_percent.toFixed(1)}%
- Vergleichsgruppe: ${context.group_size} Personen
- Betriebszugehörigkeit: ${Math.floor(context.tenure_months / 12)} Jahre
- Rolle: ${context.job_family} (${context.job_level})
- Standort: ${context.location}

Erkläre dem Mitarbeiter in 3-4 kurzen, freundlichen Sätzen:
1. Wie sein Gehalt im Vergleich steht
2. Mögliche sachliche Erklärungsfaktoren
3. Größe und Zusammensetzung der Vergleichsgruppe

Beispiel-Tonalität:
"Dein Gehalt liegt 6% unter dem Durchschnitt deiner Vergleichsgruppe. Die Vergleichsgruppe besteht aus 12 Personen mit gleicher Rolle, gleichem Level und Standort. Ein Teil der Abweichung könnte sich durch die kürzere Betriebszugehörigkeit erklären."
`;

        const result = await model.generateContent([
            { role: 'user', parts: [{ text: EMPLOYEE_EXPLANATION_SYSTEM_PROMPT }] },
            { role: 'model', parts: [{ text: 'Verstanden. Ich werde sachliche, neutrale Erklärungen für Mitarbeiter erstellen.' }] },
            { role: 'user', parts: [{ text: prompt }] },
        ]);

        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        console.error('Fehler bei Gemini AI-Generierung:', error);

        // Fallback: Regel-basierte Erklärung
        return generateRuleBasedExplanation(context);
    }
}

/**
 * Generiert eine AI-Erklärung für einen Gender Pay Gap
 */
export async function generateGenderGapExplanation(
    context: GenderGapContext
): Promise<string> {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

        const prompt = `
Gender Pay Gap Analyse:
- Vergleichsgruppe: ${context.pay_group_name}
- Gender Pay Gap: ${context.gap_percent.toFixed(2)}%
- Durchschnittsgehalt Männer: ${formatCurrency(context.male_avg)}
- Durchschnittsgehalt Frauen: ${formatCurrency(context.female_avg)}
- Anzahl Männer: ${context.male_count}
- Anzahl Frauen: ${context.female_count}
- Gesamt: ${context.total_employees} Mitarbeiter

Erkläre dem HR-Manager in 3-4 Sätzen:
1. Ob dieser Gap statistisch auffällig ist (Schwellenwert 5%)
2. Was die Zahlen bedeuten
3. Ob Handlungsbedarf besteht

Sei sachlich und professionell.
`;

        const result = await model.generateContent([
            { role: 'user', parts: [{ text: GENDER_GAP_EXPLANATION_SYSTEM_PROMPT }] },
            { role: 'model', parts: [{ text: 'Verstanden. Ich werde sachliche HR-Analysen erstellen.' }] },
            { role: 'user', parts: [{ text: prompt }] },
        ]);

        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        console.error('Fehler bei Gemini AI-Generierung:', error);

        // Fallback: Regel-basierte Erklärung
        return generateRuleBasedGapExplanation(context);
    }
}

/**
 * Chat-Funktion für Mitarbeiter-Fragen
 */
export async function chatWithAI(
    question: string,
    context: Record<string, any>,
    history: ChatMessage[] = []
): Promise<string> {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

        const contextInfo = `
Verfügbare Kontext-Daten:
${JSON.stringify(context, null, 2)}
`;

        const conversationHistory = history.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));

        const result = await model.generateContent([
            { role: 'user', parts: [{ text: CHAT_SYSTEM_PROMPT }] },
            { role: 'model', parts: [{ text: 'Verstanden. Ich beantworte nur Fragen zu Gehaltstransparenz basierend auf vorhandenen Daten.' }] },
            ...conversationHistory,
            { role: 'user', parts: [{ text: `Kontext:\n${contextInfo}\n\nFrage: ${question}` }] },
        ]);

        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        console.error('Fehler bei Gemini Chat:', error);
        return 'Entschuldigung, ich kann diese Frage gerade nicht beantworten. Bitte versuche es später erneut.';
    }
}

// ============================================================================
// FALLBACK: RULE-BASED EXPLANATIONS
// ============================================================================

function generateRuleBasedExplanation(context: EmployeeSalaryContext): string {
    const { deviation_percent, group_avg, group_size, tenure_months } = context;

    const direction = deviation_percent > 0 ? 'über' : 'unter';
    const absDeviation = Math.abs(deviation_percent);
    const tenureYears = Math.floor(tenure_months / 12);

    let explanation = `Dein Gehalt liegt ${absDeviation.toFixed(1)}% ${direction} dem Durchschnitt deiner Vergleichsgruppe. `;
    explanation += `Die Vergleichsgruppe besteht aus ${group_size} Personen mit gleicher Rolle, gleichem Level und Standort. `;

    if (absDeviation > 10 && tenureYears < 2) {
        explanation += `Ein Teil der Abweichung könnte sich durch die kürzere Betriebszugehörigkeit von ${tenureYears} Jahren erklären.`;
    } else if (absDeviation < 5) {
        explanation += `Dein Gehalt bewegt sich im üblichen Rahmen der Vergleichsgruppe.`;
    } else {
        explanation += `Die Abweichung sollte im Kontext deiner individuellen Qualifikationen und Erfahrung betrachtet werden.`;
    }

    return explanation;
}

function generateRuleBasedGapExplanation(context: GenderGapContext): string {
    const { gap_percent, male_count, female_count } = context;
    const absGap = Math.abs(gap_percent);

    let explanation = `In dieser Vergleichsgruppe besteht ein Gender Pay Gap von ${absGap.toFixed(2)}%. `;

    if (absGap > 5) {
        explanation += `Diese Abweichung ist statistisch auffällig und überschreitet den 5%-Schwellenwert. `;
        explanation += `Bei ${male_count} männlichen und ${female_count} weiblichen Mitarbeitern sollte diese Differenz näher analysiert werden.`;
    } else if (absGap >= 3) {
        explanation += `Die Abweichung liegt im Bereich von 3-5% und sollte beobachtet werden. `;
    } else {
        explanation += `Die Abweichung liegt unter 3% und ist statistisch unkritisch.`;
    }

    return explanation;
}

// ============================================================================
// UTILS
// ============================================================================

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}
