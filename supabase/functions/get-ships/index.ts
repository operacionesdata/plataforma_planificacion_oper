import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Ship {
  name: string;
  lat: number;
  lng: number;
  speed?: string;
  course?: string;
  lastUpdate?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting ship data scraping...');
    
    const loginUrl = 'https://www.qmgps.cl/qmtls_camanchaca/enlinea_camanchaca.aspx';
    
    // Step 1: Get the login page to extract ViewState
    console.log('Fetching login page...');
    const loginPageResponse = await fetch(loginUrl);
    const loginPageHtml = await loginPageResponse.text();
    
    console.log('Login page HTML length:', loginPageHtml.length);
    
    // Extract __VIEWSTATE and __EVENTVALIDATION (ASP.NET specific)
    const viewStateMatch = loginPageHtml.match(/id="__VIEWSTATE"\s+value="([^"]+)"/);
    const eventValidationMatch = loginPageHtml.match(/id="__EVENTVALIDATION"\s+value="([^"]+)"/);
    const viewStateGeneratorMatch = loginPageHtml.match(/id="__VIEWSTATEGENERATOR"\s+value="([^"]+)"/);
    
    const viewState = viewStateMatch ? viewStateMatch[1] : '';
    const eventValidation = eventValidationMatch ? eventValidationMatch[1] : '';
    const viewStateGenerator = viewStateGeneratorMatch ? viewStateGeneratorMatch[1] : '';
    
    console.log('ViewState extracted:', viewState ? 'Yes' : 'No');
    console.log('EventValidation extracted:', eventValidation ? 'Yes' : 'No');
    
    // Step 2: Perform login
    const formData = new URLSearchParams({
      '__VIEWSTATE': viewState,
      '__EVENTVALIDATION': eventValidation,
      '__VIEWSTATEGENERATOR': viewStateGenerator,
      'txtUsuario': 'centros',
      'txtClave': 'centros',
      'btnIngresar': 'Ingresar'
    });
    
    console.log('Sending login request...');
    const loginResponse = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': loginUrl,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      body: formData.toString(),
      redirect: 'follow'
    });
    
    console.log('Login response status:', loginResponse.status);
    
    const dataPageHtml = await loginResponse.text();
    console.log('Data page HTML length:', dataPageHtml.length);
    
    // Step 3: Parse ship data from HTML table - improved parsing
    const ships: Ship[] = [];
    
    // Look for table with GridView pattern (common in ASP.NET)
    // Try multiple table selectors
    const tablePatterns = [
      /<table[^>]*id="[^"]*GridView[^"]*"[^>]*>(.*?)<\/table>/gis,
      /<table[^>]*class="[^"]*grid[^"]*"[^>]*>(.*?)<\/table>/gis,
      /<table[^>]*>(.*?)<\/table>/gis
    ];
    
    let tableContent = '';
    for (const pattern of tablePatterns) {
      const match = dataPageHtml.match(pattern);
      if (match && match[1]) {
        tableContent = match[1];
        console.log('Found table with pattern:', pattern.toString().substring(0, 50));
        break;
      }
    }
    
    if (!tableContent) {
      console.log('No table found in HTML');
      console.log('HTML preview:', dataPageHtml.substring(0, 500));
    }
    
    // Parse rows from table
    const rowRegex = /<tr[^>]*>(.*?)<\/tr>/gis;
    const rows = tableContent.match(rowRegex) || [];
    
    console.log(`Found ${rows.length} rows in table`);
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      // Skip header rows
      if (row.includes('<th') || i === 0) {
        continue;
      }
      
      // Extract cells
      const cellMatches = row.match(/<td[^>]*>(.*?)<\/td>/gis) || [];
      const cells = cellMatches.map(cell => {
        // Remove HTML tags and decode entities
        return cell
          .replace(/<td[^>]*>/gi, '')
          .replace(/<\/td>/gi, '')
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .trim();
      });
      
      console.log(`Row ${i} cells:`, cells.length, cells);
      
      // Need at least name, lat, lng
      if (cells.length >= 3) {
        try {
          const name = cells[0];
          const latStr = cells[1];
          const lngStr = cells[2];
          
          // Parse coordinates - handle various formats
          const lat = parseFloat(latStr.replace(/[^\d.-]/g, ''));
          const lng = parseFloat(lngStr.replace(/[^\d.-]/g, ''));
          
          if (!isNaN(lat) && !isNaN(lng) && name && name.length > 0) {
            ships.push({
              name,
              lat,
              lng,
              speed: cells[3] || '',
              course: cells[4] || '',
              lastUpdate: new Date().toISOString()
            });
            console.log(`Added ship: ${name} at (${lat}, ${lng})`);
          }
        } catch (e) {
          console.error('Error parsing row:', e);
        }
      }
    }
    
    console.log(`Successfully parsed ${ships.length} ships`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        ships,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
    
  } catch (error) {
    console.error('Error in get-ships function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        ships: []
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
