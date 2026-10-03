import React, { useState } from 'react';
import { createEnquiry } from '../services/api';

export default function EnquiryForm() {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    origin_postcode: '',
    destination_postcode: '',
    property_type: 'House',
    bedrooms: 2,
    floor_level: 0,
    has_lift: false,
    items_json: '[]',
    preferred_date: '2026-10-15',
  });

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await createEnquiry(formData);
      setResponse(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '480px', margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h2>Submit Removal Enquiry</h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <input name="customer_name" placeholder="Full Name" value={formData.customer_name} onChange={handleChange} required />
        <input name="customer_email" type="email" placeholder="Email" value={formData.customer_email} onChange={handleChange} required />
        <input name="customer_phone" placeholder="Phone Number" value={formData.customer_phone} onChange={handleChange} required />
        <input name="origin_postcode" placeholder="Origin Postcode (e.g. BD1 1AA)" value={formData.origin_postcode} onChange={handleChange} required />
        <input name="destination_postcode" placeholder="Destination Postcode (e.g. LS1 1AA)" value={formData.destination_postcode} onChange={handleChange} required />
        <input name="preferred_date" type="date" value={formData.preferred_date} onChange={handleChange} required />

        <button type="submit" disabled={loading} style={{ padding: '10px', cursor: 'pointer' }}>
          {loading ? 'Submitting to Supabase...' : 'Submit & Get Quote'}
        </button>
      </form>

      {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}

      {response && (
        <div style={{ marginTop: '1.5rem', background: '#eef9f2', padding: '12px', borderRadius: '6px' }}>
          <h3>Enquiry Created!</h3>
          <pre style={{ fontSize: '12px' }}>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}