import { useEffect, useRef, useState } from 'react';
import type { Contact } from './useContacts';

type ContactPickerProps = {
    contacts: Contact[];
    onSelect: (contact: Contact) => void;
    label?: string;
};

export function ContactAvatar({ contact }: { contact: Contact }) {
    if (contact.photo) {
        return <img src={contact.photo} alt={contact.name} className="contact-avatar-img" />;
    }
    return <div className="contact-avatar-fallback">{contact.name.charAt(0).toUpperCase() || '?'}</div>;
}

export default function ContactPicker({ contacts, onSelect, label = '📇' }: ContactPickerProps) {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef<HTMLDivElement>(null);

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
                    {contacts.length === 0 ? (
                        <div className="contact-picker-empty">No saved contacts yet.</div>
                    ) : (
                        contacts.map(contact => (
                            <button
                                type="button"
                                key={contact.id}
                                className="contact-picker-item"
                                onClick={() => {
                                    onSelect(contact);
                                    setOpen(false);
                                }}
                            >
                                <ContactAvatar contact={contact} />
                                <div className="contact-picker-item-text">
                                    <span className="contact-picker-item-name">{contact.name}</span>
                                    <span className="contact-picker-item-addr">
                                        {contact.address.slice(0, 6)}…{contact.address.slice(-4)}
                                    </span>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
