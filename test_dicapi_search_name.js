import * as cheerio from 'cheerio';

async function testSearchByName() {
  const params = new URLSearchParams();
  params.append('ddlTipoConsultaID', '2');
  params.append('txtNave', 'DELFIN');

  const searchResponse = await fetch('https://consultas.dicapi.mil.pe/ConsultarNaves/Naves/ConsultarNave?class=form-horizontal%20contForm', {
    method: 'POST',
    body: params,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
  
  const searchHtml = await searchResponse.text();
  const $search = cheerio.load(searchHtml);
  
  const links = [];
  $search('a[href*="CodigoNave="]').each((i, el) => {
    links.push($search(el).attr('href'));
  });
  
  console.log('Links found:', links.length);
  if (links.length > 0) {
    console.log('First link:', links[0]);
  }
}

testSearchByName();
