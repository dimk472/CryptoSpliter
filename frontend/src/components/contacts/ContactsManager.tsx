// components/contacts/ContactsManager.tsx

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import type { Contact, ContactAddress } from '../../types/contacts';
import { SUPPORTED_CHAINS, getChainIcon } from '../../types/contacts';
import { compressImageToDataUrl } from './useContacts';
import { ContactAvatar } from './ContactPicker';

type ContactsManagerProps = {
    contacts: Contact[];
    onSave: (contact: {
        id?: string;
        name: string;
        photo?: string;
        addresses: Omit<ContactAddress, 'id' | 'contact_id' | 'created_at'>[];
    }) => void;
    onDelete: (id: string) => void;
    onClose: () => void;
    initialDraft?: { name?: string; address?: string } | null;
    initialEditingContact?: Contact | null;
};

export default function ContactsManager({ contacts, onSave, onDelete, onClose, initialDraft, initialEditingContact }: ContactsManagerProps) {
    const [editingId, setEditingId] = useState<string | null>(initialEditingContact?.id ?? null);
    const [name, setName] = useState(initialEditingContact?.name ?? initialDraft?.name ?? '');
    const [photo, setPhoto] = useState(initialEditingContact?.photo ?? '');
    const [addresses, setAddresses] = useState<Omit<ContactAddress, 'id' | 'contact_id' | 'created_at'>[]>(() => {
        if (initialEditingContact?.addresses && initialEditingContact.addresses.length > 0) {
            return initialEditingContact.addresses.map(a => ({
                address: a.address,
                chain_id: a.chain_id,
                chain_name: a.chain_name,
                label: a.label || undefined,
                is_primary: a.is_primary,
            }));
        }
        return [{ address: initialDraft?.address ?? '', chain_id: 1, chain_name: 'Ethereum', is_primary: true }];
    });
    const [error, setError] = useState('');

    // SAFETY: ensure contacts is always an array
    const safeContacts = contacts || [];

    const resetForm = () => {
        setEditingId(null);
        setName('');
        setPhoto('');
        setAddresses([{ address: '', chain_id: 1, chain_name: 'Ethereum', is_primary: true }]);
        setError('');
    };

    const startEdit = (contact: Contact) => {
        setEditingId(contact.id);
        setName(contact.name);
        setPhoto(contact.photo || '');
        setAddresses((contact.addresses || []).map(addr => ({
            address: addr.address,
            chain_id: addr.chain_id,
            chain_name: addr.chain_name,
            label: addr.label || undefined,
            is_primary: addr.is_primary,
        })));
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

    const addAddress = () => {
        setAddresses(prev => [...prev, { address: '', chain_id: 1, chain_name: 'Ethereum', is_primary: false }]);
    };

    const removeAddress = (index: number) => {
        if (addresses.length <= 1) {
            setError('Contact must have at least one address.');
            return;
        }
        setAddresses(prev => prev.filter((_, i) => i !== index));
    };

    const updateAddress = (index: number, field: string, value: string | number | boolean) => {
        setAddresses(prev => prev.map((addr, i) => {
            if (i !== index) return addr;

            if (field === 'chain_id') {
                const chainId = Number(value);
                const chain = SUPPORTED_CHAINS.find(c => c.chainId === chainId);
                return { ...addr, chain_id: chainId, chain_name: chain?.chainName || `Chain ${chainId}` };
            }

            if (field === 'is_primary' && value === true) {
                return { ...addr, is_primary: true };
            }

            return { ...addr, [field]: value };
        }));

        if (field === 'is_primary' && value === true) {
            setAddresses(prev => prev.map((addr, i) => ({
                ...addr,
                is_primary: i === index,
            })));
        }
    };

    const handleSubmit = () => {
        if (!name.trim()) { setError('Please enter a name.'); return; }

        const validAddresses = addresses.filter(addr => addr.address.trim().startsWith('0x'));
        if (validAddresses.length === 0) {
            setError('Please add at least one valid wallet address starting with 0x.');
            return;
        }

        onSave({
            id: editingId ?? undefined,
            name: name.trim(),
            photo: photo || undefined,
            addresses: validAddresses.map(addr => ({
                address: addr.address.trim(),
                chain_id: addr.chain_id,
                chain_name: addr.chain_name,
                label: addr.label || undefined,
                is_primary: addr.is_primary,
            })),
        });
        resetForm();
    };

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return createPortal(
        <div className="contacts-modal-overlay" onClick={handleOverlayClick}>
            <div className="contacts-modal">
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
                                placeholder="Contact name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="contacts-addresses-section">
                        <div className="contacts-addresses-header">
                            <span className="contacts-addresses-title">Wallet Addresses</span>
                            <button type="button" className="btn-text" onClick={addAddress}>
                                + Add address
                            </button>
                        </div>

                        {addresses.map((addr, index) => (
                            <div key={index} className="contacts-address-row">
                                <div className="contacts-address-fields">
                                    <input
                                        className="field-input"
                                        type="text"
                                        placeholder="0x..."
                                        value={addr.address}
                                        onChange={(e) => updateAddress(index, 'address', e.target.value)}
                                    />
                                    <select
                                        className="field-select"
                                        value={addr.chain_id}
                                        onChange={(e) => updateAddress(index, 'chain_id', e.target.value)}
                                    >
                                        {SUPPORTED_CHAINS.map(chain => (
                                            <option key={chain.chainId} value={chain.chainId}>
                                                {chain.chainName}
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        className="field-input field-input--small"
                                        type="text"
                                        placeholder="Label (optional)"
                                        value={addr.label || ''}
                                        onChange={(e) => updateAddress(index, 'label', e.target.value)}
                                    />
                                    <label className="contacts-primary-toggle">
                                        <input
                                            type="checkbox"
                                            checked={addr.is_primary}
                                            onChange={(e) => updateAddress(index, 'is_primary', e.target.checked)}
                                        />
                                        <span>Primary</span>
                                    </label>
                                </div>
                                <button
                                    type="button"
                                    className="contacts-icon-btn contacts-icon-btn--danger"
                                    onClick={() => removeAddress(index)}
                                    title="Remove address"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
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
                    {safeContacts.length === 0 && (
                        <p className="contacts-empty">No contacts saved yet. Add one above.</p>
                    )}
                    {safeContacts.map(contact => (
                        <div className="contacts-list-row" key={contact.id}>
                            <ContactAvatar contact={contact} />
                            <div className="contacts-list-text">
                                <span className="contacts-list-name">{contact.name}</span>
                                <div className="contacts-list-chains">
                                    {(contact.addresses || []).map(addr => (
                                        <span key={addr.id} className="contacts-chain-badge" title={`${addr.chain_name}: ${addr.address}`}>
                                            {getChainIcon(addr.chain_id)} {addr.chain_name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="contacts-list-actions">
                                <button type="button" className="contacts-icon-btn" onClick={() => startEdit(contact)} title="Edit">✎</button>
                                <button type="button" className="contacts-icon-btn contacts-icon-btn--danger" onClick={() => onDelete(contact.id)} title="Delete">🗑</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>,
        document.body
    );
}