// Storži — Cloudflare Worker za prijave in komentarje
// Namesti na: Cloudflare Dashboard → Workers → Nov Worker

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const headers = {
      'Access-Control-Allow-Origin': 'https://storzi.org',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    // ========== KOMENTARJI ==========
    
    // GET /komentarji?izlet=triglav — vrni komentarje za izlet
    if (request.method === 'GET' && url.pathname === '/komentarji') {
      const izlet = url.searchParams.get('izlet');
      if (!izlet) return new Response(JSON.stringify({ error: 'Manjka parameter izlet' }), { status: 400, headers });

      const data = await env.KOMENTARJI.get(izlet);
      const komentarji = data ? JSON.parse(data) : [];
      return new Response(JSON.stringify({ izlet, komentarji }), { headers });
    }

    // POST /komentarji — dodaj komentar
    if (request.method === 'POST' && url.pathname === '/komentarji') {
      const body = await request.json().catch(() => null);
      if (!body?.izlet || !body?.tekst || !body?.avtor) {
        return new Response(JSON.stringify({ error: 'Manjkajo podatki' }), { status: 400, headers });
      }

      const avtor = body.avtor.trim().slice(0, 50);
      const tekst = body.tekst.trim().slice(0, 500);
      const izlet = body.izlet.trim().slice(0, 80).toLowerCase().replace(/\s+/g, '-');

      const data = await env.KOMENTARJI.get(izlet);
      const komentarji = data ? JSON.parse(data) : [];

      komentarji.push({ avtor, tekst, datum: new Date().toISOString() });
      await env.KOMENTARJI.put(izlet, JSON.stringify(komentarji));

      return new Response(JSON.stringify({ ok: true, komentarji }), { headers });
    }

    // DELETE /komentarji — izbriši komentarje (samo admin z geslom)
    if (request.method === 'DELETE' && url.pathname === '/komentarji') {
      const body = await request.json().catch(() => null);
      const geslo = env.ADMIN_GESLO || 'storzi2026';
      if (body?.geslo !== geslo) {
        return new Response(JSON.stringify({ error: 'Napačno geslo' }), { status: 401, headers });
      }

      const { izlet } = body;
      
      if (izlet === 'ALL') {
        const list = await env.KOMENTARJI.list();
        for (const key of list.keys) {
          await env.KOMENTARJI.delete(key.name);
        }
        return new Response(JSON.stringify({ ok: true, message: 'Vsi komentarji izbrisani' }), { headers });
      }

      await env.KOMENTARJI.delete(izlet);

      return new Response(JSON.stringify({ ok: true, message: 'Komentraji izbrisani' }), { headers });
    }

    // ========== PRIJAVE ==========

    // GET /prijave?izlet=triglav
    if (request.method === 'GET' && url.pathname === '/prijave') {
      const izlet = url.searchParams.get('izlet');
      if (!izlet) return new Response(JSON.stringify({ error: 'Manjka parameter izlet' }), { status: 400, headers });

      const data = await env.PRIJAVE.get(izlet);
      const prijave = data ? JSON.parse(data) : [];
      return new Response(JSON.stringify({ izlet, prijave }), { headers });
    }

    // POST /prijave
    if (request.method === 'POST' && url.pathname === '/prijave') {
      const body = await request.json().catch(() => null);
      if (!body?.izlet || !body?.ime) {
        return new Response(JSON.stringify({ error: 'Manjkata ime ali izlet' }), { status: 400, headers });
      }

      const ime = body.ime.trim().slice(0, 60);
      const izlet = body.izlet.trim().slice(0, 80);

      const data = await env.PRIJAVE.get(izlet);
      const prijave = data ? JSON.parse(data) : [];

      const obstaja = prijave.some(p => p.ime.toLowerCase() === ime.toLowerCase());
      if (obstaja) {
        return new Response(JSON.stringify({ error: 'To ime je že prijavljeno.' }), { status: 409, headers });
      }

      prijave.push({ ime, cas: new Date().toISOString() });
      await env.PRIJAVE.put(izlet, JSON.stringify(prijave));

      return new Response(JSON.stringify({ ok: true, prijave }), { headers });
    }

    // DELETE /prijave
    if (request.method === 'DELETE' && url.pathname === '/prijave') {
      const body = await request.json().catch(() => null);
      if (body?.geslo !== env.ADMIN_GESLO) {
        return new Response(JSON.stringify({ error: 'Napačno geslo' }), { status: 401, headers });
      }

      const { izlet, ime } = body;
      const data = await env.PRIJAVE.get(izlet);
      if (!data) return new Response(JSON.stringify({ error: 'Izlet ne obstaja' }), { status: 404, headers });

      const prijave = JSON.parse(data).filter(p => p.ime !== ime);
      await env.PRIJAVE.put(izlet, JSON.stringify(prijave));

      return new Response(JSON.stringify({ ok: true, prijave }), { headers });
    }

    return new Response(JSON.stringify({ error: 'Ni najdeno' }), { status: 404, headers });
  }
};
