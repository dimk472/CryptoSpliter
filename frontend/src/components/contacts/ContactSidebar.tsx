// components/contacts/ContactSidebar.tsx

import { useState } from 'react';
import { Contact, Plus } from 'lucide-react';
import type { Contact as ContactType } from '../../types/contacts';
import { getChainIcon } from '../../types/contacts';

type ContactsSidebarProps = {
    contacts: ContactType[];
    onSelectContact: (contact: ContactType, address: string, chainId: number) => void;
    onAddContact: () => void;
    onEditContact: (contact: ContactType) => void;
};

export default function ContactsSidebar({ contacts, onSelectContact, onAddContact, onEditContact }: ContactsSidebarProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedContacts, setExpandedContacts] = useState<Set<string>>(new Set());

    // ΠΡΟΣΘΕΣΕ αυτό το safety check
    const safeContacts = contacts || [];

    const filteredContacts = safeContacts.filter(contact =>
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contact.addresses || []).some(addr =>
            addr.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
            addr.chain_name.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    const toggleExpand = (contactId: string) => {
        setExpandedContacts(prev => {
            const next = new Set(prev);
            if (next.has(contactId)) {
                next.delete(contactId);
            } else {
                next.add(contactId);
            }
            return next;
        });
    };

    return (
        <div className="contacts-sidebar">
            <div className="contacts-sidebar-header">
                <div className="contacts-sidebar-title">
                    <Contact size={16} strokeWidth={2} />
                    <span>Contacts</span>
                </div>
                <button
                    type="button"
                    className="contacts-sidebar-add-btn"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onAddContact();
                    }}
                    title="Add new contact"
                >
                    <Plus size={14} strokeWidth={2} />
                </button>
            </div>

            <div className="contacts-sidebar-search">
                <input
                    type="text"
                    className="contacts-search-input"
                    placeholder="Search contacts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="contacts-sidebar-list">
                {filteredContacts.length === 0 && (
                    <div className="contacts-sidebar-empty">
                        {searchTerm ? 'No matching contacts' : 'No contacts yet'}
                    </div>
                )}

                {filteredContacts.map(contact => (
                    <div key={contact.id} className="contacts-sidebar-item">
                        <button
                            type="button"
                            className="contacts-sidebar-contact"
                            onClick={() => toggleExpand(contact.id)}
                        >
                            <div className="contact-mini-avatar">
                                {contact.photo ? (
                                    <img src={contact.photo} alt={contact.name} />
                                ) : (
                                    <span>{contact.name.charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                            <div className="contacts-sidebar-contact-info">
                                <span className="contacts-sidebar-contact-name">{contact.name}</span>
                                <span className="contacts-sidebar-contact-count">
                                    {(contact.addresses || []).length} address{(contact.addresses || []).length !== 1 ? 'es' : ''}
                                </span>
                            </div>
                            <button
                                type="button"
                                className="contacts-sidebar-edit-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEditContact(contact);
                                }}
                                title="Edit contact"
                            >
                                ✎
                            </button>
                        </button>

                        {expandedContacts.has(contact.id) && (contact.addresses || []).length > 0 && (
                            <div className="contacts-sidebar-addresses">
                                {(contact.addresses || []).map(addr => (
                                    <button
                                        key={addr.id}
                                        type="button"
                                        className="contacts-sidebar-address"
                                        onClick={() => onSelectContact(contact, addr.address, addr.chain_id)}
                                    >
                                        <span className="contact-chain-icon">{getChainIcon(addr.chain_id)}</span>
                                        <span className="contacts-sidebar-address-text">
                                            {addr.address.slice(0, 6)}…{addr.address.slice(-4)}
                                        </span>
                                        <span className="contacts-sidebar-chain-name">{addr.chain_name}</span>
                                        {addr.label && (
                                            <span className="contacts-sidebar-label">{addr.label}</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}