import React, { useState } from 'react';
import { type Contact, compressImageToDataUrl } from './useContacts';
import { ContactAvatar } from './ContactPicker';

type ContactsManagerProps = {
    contacts: Contact[];
    onSave: (contact: Omit<Contact, 'id'> & { id?: string }) => void;
    onDelete: (id: string) => void;
    onClose: () => void;
    initialDraft?: { name?: string; address?: string } | null;
};

export default function ContactsManager({ contacts, onSave, onDelete, onClose, initialDraft }: ContactsManagerProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState(initialDraft?.name ?? '');
    const [address, setAddress] = useState(initialDraft?.address ?? '');
    const [photo, setPhoto] = useState('');
    const [error, setError] = useState('');

    const resetForm = () => {
        setEditingId(null);
        setName('');
        setAddress('');
        setPhoto('');
        setError('');
    };

    const startEdit = (contact: Contact) => {
        setEditingId(contact.id);
        setName(contact.name);
        setAddress(contact.address);
        setPhoto(contact.photo);
        setError('');
    };

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const dataUrl = await compressImageToDataUrl(file);
            setPhoto(dataUrl);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not process the image.');
        } finally {
            e.target.value = '';
        }
    };

    const handleSubmit = () => {
        if (!name.trim()) { setError('Please enter a name.'); return; }
        if (!address.trim().startsWith('0x')) { setError('Please enter a valid wallet address starting with 0x.'); return; }

        onSave({ id: editingId ?? undefined, name: name.trim(), address: address.trim(), photo });
        resetForm();
    };

    return (
        <div className="contacts-modal-overlay" onClick={onClose}>
            <div className="contacts-modal" onClick={(e) => e.stopPropagation()}>
                <div className="contacts-modal-header">
                    <h3>My Contacts</h3>
                    <button type="button" className="contacts-modal-close" onClick={onClose} aria-label="Close">✕</button>
                </div>

                <div className="contacts-modal-form">
                    <div className="contacts-photo-row">
                        <label className="contacts-photo-upload">
                            {photo ? (
                                <img src={photo} alt="Preview" className="contacts-photo-preview" />
                            ) : (
                                <span className="contacts-photo-placeholder">+</span>
                            )}
                            <input type="file" accept="image/*" onChange={handlePhotoChange} hidden />
                        </label>

                        <div className="contacts-form-fields">
                            <input
                                className="field-input"
                                type="text"
                                placeholder="Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                            <input
                                className="field-input"
                                type="text"
                                placeholder="Wallet address (0x...)"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && <p className="contacts-form-error">{error}</p>}

                    <div className="contacts-form-actions">
                        {editingId && (
                            <button type="button" className="btn-secondary" onClick={resetForm}>Cancel edit</button>
                        )}
                        <button type="button" className="btn-primary" onClick={handleSubmit}>
                            {editingId ? 'Save changes' : 'Add contact'}
                        </button>
                    </div>
                </div>

                <div className="contacts-list">
                    {contacts.length === 0 && (
                        <p className="contacts-empty">No contacts saved yet. Add one above.</p>
                    )}
                    {contacts.map(contact => (
                        <div className="contacts-list-row" key={contact.id}>
                            <ContactAvatar contact={contact} />
                            <div className="contacts-list-text">
                                <span className="contacts-list-name">{contact.name}</span>
                                <span className="contacts-list-addr">
                                    {contact.address.slice(0, 8)}…{contact.address.slice(-6)}
                                </span>
                            </div>
                            <div className="contacts-list-actions">
                                <button type="button" className="contacts-icon-btn" onClick={() => startEdit(contact)} title="Edit">✎</button>
                                <button type="button" className="contacts-icon-btn contacts-icon-btn--danger" onClick={() => onDelete(contact.id)} title="Delete">🗑</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
