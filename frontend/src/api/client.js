const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

export async function submitEnquiry(promptText) {
  const response = await fetch(`${API_BASE_URL}/enquiry/parse-prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: promptText }),
  });
  if (!response.ok) throw new Error('Failed to submit enquiry');
  return await response.json();
}

export async function confirmBooking(bookingData) {
  const response = await fetch(`${API_BASE_URL}/booking/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingData),
  });
  if (!response.ok) throw new Error('Failed to confirm booking');
  return await response.json();
}