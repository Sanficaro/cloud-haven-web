'use client';

import { useState, useEffect } from 'react';

type Personality = {
    info: string;
    defaultMessage: string;
    defaultAnswers: string;
    negativePrompt: string;
};

type Personalities = {
    [key: string]: Personality;
};

export default function AdminPage() {
    const [data, setData] = useState<Personalities | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch('/api/admin/personalities')
            .then(res => res.json())
            .then(json => {
                setData(json);
                setLoading(false);
            });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        const res = await fetch('/api/admin/personalities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            alert('Personalities Updated Successfully!');
        }
        setSaving(false);
    };

    const handleChange = (char: string, field: keyof Personality, value: string) => {
        if (!data) return;
        setData({
            ...data,
            [char]: {
                ...data[char],
                [field]: value
            }
        });
    };

    if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading Haven Neural Core...</div>;

    return (
        <div className="min-h-screen bg-black text-gray-300 p-8 font-mono">
            <header className="mb-12 border-b border-gray-800 pb-6">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                    HAVEN_PERSONALITY_LAB
                </h1>
                <p className="text-gray-500 mt-2">Modify the neural signatures of Alfred, Neo, and Ms. Tramell.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {Object.keys(data || {}).map((char) => (
                    <div key={char} className="bg-zinc-900 border border-gray-800 rounded-xl p-6 shadow-2xl">
                        <h2 className="text-xl font-bold mb-6 uppercase tracking-widest text-blue-400 border-b border-gray-800 pb-2">
                            {char}
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block uppercase">Personality Info</label>
                                <textarea
                                    className="w-full bg-black border border-gray-800 rounded p-2 text-sm focus:border-blue-500 outline-none h-24"
                                    value={data?.[char].info}
                                    onChange={(e) => handleChange(char, 'info', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block uppercase">Default Message</label>
                                <textarea
                                    className="w-full bg-black border border-gray-800 rounded p-2 text-sm focus:border-blue-500 outline-none h-16"
                                    value={data?.[char].defaultMessage}
                                    onChange={(e) => handleChange(char, 'defaultMessage', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block uppercase">Default Answers</label>
                                <textarea
                                    className="w-full bg-black border border-gray-800 rounded p-2 text-sm focus:border-blue-500 outline-none h-16"
                                    value={data?.[char].defaultAnswers}
                                    onChange={(e) => handleChange(char, 'defaultAnswers', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block uppercase">Negative Prompt</label>
                                <textarea
                                    className="w-full bg-black border border-gray-800 rounded p-2 text-sm focus:border-blue-500 outline-none h-16"
                                    value={data?.[char].negativePrompt}
                                    onChange={(e) => handleChange(char, 'negativePrompt', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <footer className="mt-12 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-3 rounded-full font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                    {saving ? 'UPDATING NEURAL LINK...' : 'UPDATE SYSTEM PERSONALITIES'}
                </button>
            </footer>
        </div>
    );
}
