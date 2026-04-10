import * as cheerio from 'cheerio';

async function checkSearchForm() {
  const response = await fetch('https://consultas.dicapi.mil.pe/ConsultarNaves/Naves/ConsultarNave');
  const html = await response.text();
  const $ = cheerio.load(html);
  
  const options = [];
  $('#ddlTipoConsultaID option').each((i, el) => {
    options.push({
      value: $(el).attr('value'),
      text: $(el).text().trim()
    });
  });
  
  console.log('Search Options:', options);
}

checkSearchForm();
