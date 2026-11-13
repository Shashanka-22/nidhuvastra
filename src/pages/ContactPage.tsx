import React, { useState } from 'react';
import { CheckCircle2, Clock, Instagram, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { BRAND } from '../data/brand';
import { useStore } from '../context/StoreContext';

export const ContactPage: React.FC = () => {
  const { showToast } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('Saree Availability & Styling');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ticketId, setTicketId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, subject, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Please complete your contact details and message.', 'error');
      } else {
        setTicketId(data.ticketId);
        setName('');
        setEmail('');
        setPhone('');
        setMessage('');
        showToast('Your message has been sent to NidhuVastra.', 'success');
      }
    } catch {
      showToast('Unable to send message right now. Please reach us via WhatsApp.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1280px] px-4 sm:px-8 py-12 sm:py-16">
      <div className="max-w-2xl mb-12">
        <p className="text-xs uppercase tracking-[0.18em] text-[#641E32] font-medium">
          Get in Touch
        </p>
        <h1 className="font-editorial text-4xl sm:text-5xl font-medium text-[#242020] mt-2">
          Contact NidhuVastra
        </h1>
        <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#5C5252]">
          Whether you need help choosing a saree, checking weave specifications, or tracking an existing order, our Mysuru team is happy to assist.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Direct Info */}
        <div className="lg:col-span-5 bg-white border border-[#242020]/10 p-6 sm:p-8 space-y-6">
          <h2 className="font-editorial text-2xl font-medium text-[#242020]">
            Customer Support Details
          </h2>

          <dl className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-[#641E32] shrink-0 mt-1" />
              <div>
                <dt className="text-xs uppercase tracking-wider text-[#5C5252]">Studio Location</dt>
                <dd className="font-medium text-[#242020] mt-0.5">{BRAND.address}</dd>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="h-4 w-4 text-[#641E32] shrink-0 mt-1" />
              <div>
                <dt className="text-xs uppercase tracking-wider text-[#5C5252]">Phone &amp; WhatsApp</dt>
                <dd className="font-medium text-[#242020] tabular-nums mt-0.5">
                  <a href={`tel:${BRAND.phone.replace(/\s+/g, '')}`} className="hover:text-[#641E32]">
                    {BRAND.phone}
                  </a>
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-[#641E32] shrink-0 mt-1" />
              <div>
                <dt className="text-xs uppercase tracking-wider text-[#5C5252]">Email</dt>
                <dd className="font-medium text-[#242020] mt-0.5">
                  <a href={`mailto:${BRAND.email}`} className="hover:text-[#641E32]">
                    {BRAND.email}
                  </a>
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-4 w-4 text-[#641E32] shrink-0 mt-1" />
              <div>
                <dt className="text-xs uppercase tracking-wider text-[#5C5252]">Support Hours</dt>
                <dd className="font-medium text-[#242020] mt-0.5">{BRAND.hours}</dd>
              </div>
            </div>
          </dl>

          <div className="pt-4 border-t border-[#242020]/10 flex flex-wrap gap-3">
            <a
              href={BRAND.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#242020] px-5 py-3 text-xs font-medium uppercase tracking-[0.14em] text-[#FAF7F2] hover:bg-[#641E32] transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Chat on WhatsApp</span>
            </a>

            <a
              href={BRAND.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-[#242020]/20 px-5 py-3 text-xs font-medium uppercase tracking-[0.14em] text-[#242020] hover:border-[#641E32] hover:text-[#641E32]"
            >
              <Instagram className="h-4 w-4" />
              <span>Instagram</span>
            </a>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-7 bg-white border border-[#242020]/10 p-6 sm:p-8">
          <h2 className="font-editorial text-2xl font-medium text-[#242020] mb-5">
            Send Us a Message
          </h2>

          {ticketId ? (
            <div className="bg-[#FAF7F2] border border-[#C5A46D]/60 p-6 space-y-2">
              <div className="flex items-center gap-2 text-[#2E5A3E] font-medium text-sm">
                <CheckCircle2 className="h-5 w-5" />
                <span>Inquiry Received ({ticketId})</span>
              </div>
              <p className="text-sm text-[#5C5252]">
                Thank you for reaching out to NidhuVastra. Our team will respond during support hours ({BRAND.hours}).
              </p>
              <button
                type="button"
                onClick={() => setTicketId('')}
                className="mt-2 text-xs font-medium text-[#641E32] hover:underline cursor-pointer"
              >
                Send another inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="cnt-name" className="block text-xs font-medium uppercase tracking-wider text-[#5C5252] mb-1.5">
                    Your Name *
                  </label>
                  <input
                    id="cnt-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-[#242020]/20 bg-[#FAF7F2]/50 px-4 py-3 text-sm focus:border-[#641E32] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="cnt-phone" className="block text-xs font-medium uppercase tracking-wider text-[#5C5252] mb-1.5">
                    Mobile / WhatsApp *
                  </label>
                  <input
                    id="cnt-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-[#242020]/20 bg-[#FAF7F2]/50 px-4 py-3 text-sm focus:border-[#641E32] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="cnt-email" className="block text-xs font-medium uppercase tracking-wider text-[#5C5252] mb-1.5">
                    Email Address
                  </label>
                  <input
                    id="cnt-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-[#242020]/20 bg-[#FAF7F2]/50 px-4 py-3 text-sm focus:border-[#641E32] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="cnt-subject" className="block text-xs font-medium uppercase tracking-wider text-[#5C5252] mb-1.5">
                    Topic
                  </label>
                  <select
                    id="cnt-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full border border-[#242020]/20 bg-[#FAF7F2]/50 px-4 py-3 text-sm focus:border-[#641E32] focus:outline-none"
                  >
                    <option>Saree Availability &amp; Styling</option>
                    <option>Order Status &amp; Dispatch</option>
                    <option>Exchange Assistance</option>
                    <option>Bulk / Festive Gifting Enquiry</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="cnt-msg" className="block text-xs font-medium uppercase tracking-wider text-[#5C5252] mb-1.5">
                  Message *
                </label>
                <textarea
                  id="cnt-msg"
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share product code or order reference if applicable..."
                  className="w-full border border-[#242020]/20 bg-[#FAF7F2]/50 px-4 py-3 text-sm focus:border-[#641E32] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="bg-[#641E32] px-8 py-3.5 text-xs font-medium uppercase tracking-[0.16em] text-[#FAF7F2] hover:bg-[#4B1424] transition-colors disabled:opacity-60 cursor-pointer"
              >
                {submitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
