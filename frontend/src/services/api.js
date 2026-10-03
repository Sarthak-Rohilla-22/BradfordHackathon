const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

export async function createEnquiry(enquiryData) {
  const response = await fetch(`${API_BASE_URL}/enquiry/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(enquiryData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to submit enquiry');
  }

  return await response.json();
}