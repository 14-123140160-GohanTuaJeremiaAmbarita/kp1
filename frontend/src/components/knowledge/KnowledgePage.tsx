import { useState, useCallback, useTransition } from "react";
import api from "../../api/axios";

interface KnowledgeItem {
    id: string;
    title: string;
    category: "faq" | "sop" | "manual";
    content: string;
    createdAt: string;
}

const CATEGORY_LABEL: Record<string, string> = {
    faq: "❓ FAQ",
    sop: "📋 SOP",
    manual: "📖 Manual IT",
};

async function fetchKnowledge(): Promise<KnowledgeItem[]> {
    const { data } = await api.get<KnowledgeItem[]>("/knowledge");
    return data;
}

export default function KnowledgePage() {
    const [items, setItems]       = useState<KnowledgeItem[]>([]);
    const [search, setSearch]     = useState("");
    const [loading, startLoading] = useTransition();
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving]     = useState(false);
    const [initialized, setInitialized] = useState(false);
    const [form, setForm]         = useState({
        title: "", category: "faq", content: ""
    });

    // Fetch di luar useEffect — dipanggil saat komponen pertama render
    const load = useCallback(() => {
        startLoading(async () => {
            try {
                const data = await fetchKnowledge();
                setItems(data);
            } catch {
                setItems([]);
            }
        });
    }, []);

    // Inisialisasi sekali saat mount — tanpa useEffect
    if (!initialized) {
        setInitialized(true);
        load();
    }

    const filtered = items.filter(i =>
        i.title.toLowerCase().includes(search.toLowerCase()) ||
        i.content.toLowerCase().includes(search.toLowerCase())
    );

    async function handleAdd() {
        if (!form.title.trim() || !form.content.trim()) return;
        setSaving(true);
        try {
            await api.post("/knowledge", form);
            setForm({ title: "", category: "faq", content: "" });
            setShowForm(false);
            load();
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Hapus item ini?")) return;
        await api.delete(`/knowledge/${id}`);
        load();
    }

    return (
        <div className="knowledge-page">

            <div className="knowledge-header">
                <div>
                    <h2 className="knowledge-title">Knowledge Base</h2>
                    <p className="knowledge-sub">FAQ, SOP, dan Manual IT PT Voksel Electric</p>
                </div>
                <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
                    {showForm ? "✕ Batal" : "+ Tambah"}
                </button>
            </div>

            {showForm && (
                <div className="knowledge-form">
                    <div className="form-row">
                        <input
                            className="form-input"
                            placeholder="Judul (contoh: Cara reset password WiFi)"
                            value={form.title}
                            onChange={e => setForm({ ...form, title: e.target.value })}
                        />
                        <select
                            className="form-select"
                            value={form.category}
                            aria-label="Kategori Knowledge"
                            title="Kategori Knowledge"
                            onChange={e => setForm({ ...form, category: e.target.value })}
                        >
                            <option value="faq">FAQ</option>
                            <option value="sop">SOP</option>
                            <option value="manual">Manual IT</option>
                        </select>
                    </div>
                    <textarea
                        className="form-textarea"
                        placeholder="Isi konten / jawaban / prosedur..."
                        value={form.content}
                        onChange={e => setForm({ ...form, content: e.target.value })}
                        rows={5}
                    />
                    <button
                        className="btn-primary"
                        onClick={handleAdd}
                        disabled={saving}
                    >
                        {saving ? "Menyimpan..." : "💾 Simpan"}
                    </button>
                </div>
            )}

            <div className="knowledge-search">
                <input
                    className="form-input"
                    placeholder="🔍 Cari judul atau isi..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <span className="knowledge-count">{filtered.length} item</span>
            </div>

            {loading ? (
                <div className="dash-loading">
                    <div className="dash-spinner" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="knowledge-empty">
                    <p>📭 Belum ada konten. Tambahkan FAQ, SOP, atau Manual IT.</p>
                </div>
            ) : (
                <div className="knowledge-list">
                    {filtered.map(item => (
                        <div key={item.id} className="knowledge-card">
                            <div className="knowledge-card-header">
                                <span className={`kb-badge kb-badge--${item.category}`}>
                                    {CATEGORY_LABEL[item.category]}
                                </span>
                                <button
                                    className="kb-delete"
                                    onClick={() => handleDelete(item.id)}
                                    title="Hapus"
                                    aria-label="Hapus item"
                                >
                                    🗑️
                                </button>
                            </div>
                            <h4 className="kb-title">{item.title}</h4>
                            <p className="kb-content">{item.content}</p>
                            <p className="kb-date">
                                {new Date(item.createdAt).toLocaleDateString("id-ID", {
                                    day: "numeric", month: "long", year: "numeric"
                                })}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}