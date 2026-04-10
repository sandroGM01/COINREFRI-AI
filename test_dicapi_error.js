import * as cheerio from 'cheerio';

async function testSearchError() {
  const params = new URLSearchParams();
  params.append('ddlTipoConsultaID', '1');
  params.append('txtNave', 'INVENTADO123');

  const searchResponse = await fetch('https://consultas.dicapi.mil.pe/ConsultarNaves/Naves/ConsultarNave?class=form-horizontal%20contForm', {
    method: 'POST',
    body: params,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
  
  const searchHtml = await searchResponse.text();
  const $search = cheerio.load(searchHtml);
  
  const detailLink = $search('a[href*="CodigoNave="]').attr('href');
  console.log('detailLink:', detailLink);
  
  if (!detailLink) {
    // Try to find the error message
    const bodyText = $search('body').text().replace(/\s+/g, ' ');
    const match = bodyText.match(/No se registra ninguna embarcación.{0,100}/i);
    if (match) {
      console.log('Regex match:', match[0]);
    }
  }
}

testSearchError();
