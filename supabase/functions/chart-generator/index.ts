import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChartRequest {
  type: 'bar' | 'line' | 'pie' | 'doughnut' | 'comparison';
  title: string;
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string;
  }>;
  options?: {
    width?: number;
    height?: number;
    showLegend?: boolean;
    currency?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: ChartRequest = await req.json();
    const { type, title, labels, datasets, options = {} } = request;

    const width = options.width || 500;
    const height = options.height || 300;

    // Build Chart.js configuration
    const chartConfig = {
      type: type === 'comparison' ? 'bar' : type,
      data: {
        labels,
        datasets: datasets.map((ds, i) => ({
          label: ds.label,
          data: ds.data,
          backgroundColor: ds.backgroundColor || getDefaultColors(ds.data.length),
          borderColor: ds.borderColor || (type === 'line' ? '#4f46e5' : undefined),
          borderWidth: type === 'line' ? 2 : 1,
          fill: type === 'line' ? false : undefined,
        }))
      },
      options: {
        responsive: false,
        plugins: {
          title: {
            display: true,
            text: title,
            font: { size: 16, weight: 'bold' }
          },
          legend: {
            display: options.showLegend !== false,
            position: 'bottom'
          }
        },
        scales: type !== 'pie' && type !== 'doughnut' ? {
          y: {
            beginAtZero: true,
            ticks: options.currency ? {
              callback: (value: number) => `${options.currency}${value.toLocaleString()}`
            } : undefined
          }
        } : undefined
      }
    };

    // Use QuickChart.io API
    const quickChartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&w=${width}&h=${height}&bkg=white`;

    // Fetch the chart as PNG
    const chartResponse = await fetch(quickChartUrl);
    
    if (!chartResponse.ok) {
      throw new Error(`Chart generation failed: ${chartResponse.status}`);
    }

    const chartBuffer = await chartResponse.arrayBuffer();
    const base64Chart = btoa(String.fromCharCode(...new Uint8Array(chartBuffer)));

    console.log(`[CHART GEN] Generated ${type} chart: ${title}`);

    return new Response(JSON.stringify({
      success: true,
      chart: {
        url: quickChartUrl,
        base64: `data:image/png;base64,${base64Chart}`,
        width,
        height
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Chart generation error:", e);
    return new Response(JSON.stringify({ 
      error: e instanceof Error ? e.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getDefaultColors(count: number): string[] {
  const palette = [
    '#4f46e5', // Indigo
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#06b6d4', // Cyan
    '#ec4899', // Pink
    '#84cc16', // Lime
  ];
  
  return Array(count).fill(null).map((_, i) => palette[i % palette.length]);
}
