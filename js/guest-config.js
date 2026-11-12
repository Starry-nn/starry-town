/* Guest book storage (Supabase). Both values are public by design: the database only lets visitors add a note, never read one.
   Fill them in from Supabase → Project Settings → API. While they are empty, visitors can still make an avatar but cannot send a note. */
window.GUEST_CONFIG = {
  url: '',     // e.g. https://abcdefgh.supabase.co
  key: '',     // the "anon" / "publishable" key
};
