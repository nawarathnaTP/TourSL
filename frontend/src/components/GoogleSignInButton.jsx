import { useEffect, useRef } from 'react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function GoogleSignInButton({ onSuccess, text = 'signin_with' }) {
  const btnRef = useRef(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !window.google?.accounts?.id) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        if (response.credential) onSuccess(response.credential);
      },
    });

    window.google.accounts.id.renderButton(btnRef.current, {
      theme: 'outline',
      size: 'large',
      width: '100%',
      text,
      shape: 'pill',
    });
  }, [onSuccess, text]);

  if (!GOOGLE_CLIENT_ID) return null;

  return <div ref={btnRef} className="w-full flex justify-center" />;
}
