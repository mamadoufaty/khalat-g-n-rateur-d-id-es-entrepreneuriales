"use client"

import { useState, FormEvent } from 'react';
import { useAuth } from '@clerk/nextjs';
import DatePicker from 'react-datepicker';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
// 🗑️ SUPPRIMÉ: import { fetchEventSource } from '@microsoft/fetch-event-source';
import { Protect, PricingTable, UserButton } from '@clerk/nextjs';

function ConsultationForm() {
    const { getToken } = useAuth();

    // Form state
    const [patientName, setPatientName] = useState('');
    const [visitDate, setVisitDate] = useState<Date | null>(new Date());
    const [notes, setNotes] = useState('');

    // 🔄 MODIFIÉ: Plus de streaming state, simple state maintenant
    const [output, setOutput] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setOutput('');
        setLoading(true);

        const jwt = await getToken();
        if (!jwt) {
            setOutput('Authentication required');
            setLoading(false);
            return;
        }

        try {
            // 🔄 NOUVEAU: Remplacer fetchEventSource par fetch standard
            const response = await fetch('/api/consultation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${jwt}`,
                },
                body: JSON.stringify({
                    patient_name: patientName,
                    date_of_visit: visitDate?.toISOString().slice(0, 10),
                    notes,
                }),
            });

            if (response.ok) {
                // 🔄 NOUVEAU: Récupérer les données JSON complètes
                const data = await response.json();
                // 🔄 NOUVEAU: Utiliser data.summary (nom retourné par votre API)
                setOutput(data.summary);
            } else {
                // 🔄 NOUVEAU: Gestion des erreurs HTTP
                const errorData = await response.json();
                setOutput(`Error: ${errorData.error || response.statusText}`);
            }
        } catch (err) {
            // 🔄 NOUVEAU: Gestion des erreurs réseau
            console.error('Fetch error:', err);
            setOutput('Network error occurred');
        } finally {
            // 🔄 NOUVEAU: Toujours arrêter le loading
            setLoading(false);
        }
        
        // 🗑️ SUPPRIMÉ: Tout le code avec fetchEventSource, controller, buffer, etc.
    }

    return (
        <div className="container mx-auto px-4 py-12 max-w-3xl">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-8">
                Notes de Consultation
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
                <div className="space-y-2">
                    <label htmlFor="patient" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Nom du Patient
                    </label>
                    <input
                        id="patient"
                        type="text"
                        required
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="Entrez le nom complet du patient"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Date de visite
                    </label>
                    <DatePicker
                        id="date"
                        selected={visitDate}
                        onChange={(d: Date | null) => setVisitDate(d)}
                        dateFormat="yyyy-MM-dd"
                        placeholderText="Sélectionnez une date"
                        required
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Notes de Consultation
                    </label>
                    <textarea
                        id="notes"
                        required
                        rows={8}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="Entrez les notes détaillées de la consultation..."
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                    {loading ? 'Génération du résumé...' : 'Générer un résumé'}
                </button>
            </form>

            {output && (
                <section className="mt-8 bg-gray-50 dark:bg-gray-800 rounded-xl shadow-lg p-8">
                    <div className="markdown-content prose prose-blue dark:prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                            {output}
                        </ReactMarkdown>
                    </div>
                </section>
            )}
        </div>
    );
}

export default function Product() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            {/* User Menu in Top Right */}
            <div className="absolute top-4 right-4">
                <UserButton showName={true} />
            </div>

            {/* Subscription Protection */}
            <Protect
                plan="premium_subscription"
                fallback={
                    <div className="container mx-auto px-4 py-12">
                        <header className="text-center mb-12">
                            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                               Régime des professionnels de la santé
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 text-lg mb-8">
                               Optimisez vos consultations patients grâce à des résumés basés sur IA.
                            </p>
                        </header>
                        <div className="max-w-4xl mx-auto">
                            <PricingTable />
                        </div>
                    </div>
                }
            >
                <ConsultationForm />
            </Protect>
        </main>
    );
}