// components/contacts/ContactPicker.tsx

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Contact } from 'lucide-react';
import type { Contact as ContactType } from '../../types/contacts';
import { getChainIcon } from '../../types/contacts';

type ContactPickerProps = {
    contacts: ContactType[];
    onSelect: (contact: ContactType, address: string) => void;
    label?: ReactNode;
};

export function ContactAvatar({ contact }: { contact: ContactType }) {
    if (contact.photo) {
        return <img src={contact.photo} alt={contact.name} className="contact-avatar-img" />;
    }
    return <div className="contact-avatar-fallback">{contact.name.charAt(0).toUpperCase() || '?'}</div>;
}

export default function ContactPicker({ contacts, onSelect, label = <Contact size={15} strokeWidth={2} /> }: ContactPickerProps) {
    const [open, setOpen] = useState(false);
    const [expandedContact, setExpandedContact] = useState<string | null>(null);
    const wrapRef = useRef<HTMLDivElement>(null);

    const safeContacts = contacts || [];

    useEffect(() => {
        if (!open) return;
        const handleOutside = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, [open]);

    return (
        <div className="contact-picker" ref={wrapRef}>
            <button
                type="button"
                className="contact-picker-btn"
                onClick={() => setOpen(prev => !prev)}
                title="Choose from contacts"
                aria-label="Choose from saved contacts"
            >
                {label}
            </button>

            {open && (
                <div className="contact-picker-dropdown">
                    {safeContacts.length === 0 ? (
                        <div className="contact-picker-empty">No saved contacts yet.</div>
                    ) : (
                        safeContacts.map(contact => (
                            <div key={contact.id} className="contact-picker-group">
                                <button
                                    type="button"
                                    className="contact-picker-item contact-picker-item--main"
                                    onClick={() => {
                                        const addrs = contact.addresses || [];
                                        if (addrs.length === 1) {
                                            onSelect(contact, addrs[0].address);
                                            setOpen(false);
                                        } else {
                                            setExpandedContact(expandedContact === contact.id ? null : contact.id);
                                        }
                                    }}
                                >
                                    <ContactAvatar contact={contact} />
                                    <div className="contact-picker-item-text">
                                        <span className="contact-picker-item-name">{contact.name}</span>
                                        <span className="contact-picker-item-addr-count">
                                            {(contact.addresses || []).length} address{(contact.addresses || []).length !== 1 ? 'es' : ''}
                                        </span>
                                    </div>
                                    {(contact.addresses || []).length > 1 && (
                                        <span className="contact-picker-expand-icon">
                                            {expandedContact === contact.id ? '▾' : '▸'}
                                        </span>
                                    )}
                                </button>

                                {expandedContact === contact.id && (contact.addresses || []).length > 1 && (
                                    <div className="contact-picker-addresses">
                                        {(contact.addresses || []).map(addr => (
                                            <button
                                                type="button"
                                                key={addr.id}
                                                className="contact-picker-item contact-picker-item--address"
                                                onClick={() => {
                                                    onSelect(contact, addr.address);
                                                    setOpen(false);
                                                }}
                                            >
                                                <span className="contact-chain-icon">{getChainIcon(addr.chain_id)}</span>
                                                <span className="contact-picker-item-addr">
                                                    {addr.address.slice(0, 6)}…{addr.address.slice(-4)}
                                                </span>
                                                <span className="contact-chain-name">{addr.chain_name}</span>
                                                {addr.is_primary && (
                                                    <span className="contact-picker-primary-badge">Primary</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}