"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  Time,
  LineStyle,
  PriceLineOptions,
  CrosshairMode,
} from "lightweight-charts";
import { useCandleSnapshotQuery, type CandleInterval, type Candle } from "@/store/api/hyperliquidApi";

interface TradingChartProps {
  coin: string;
  interval: CandleInterval;
  onPriceClick?: (price: number) => void;
  entryPrice?: number | null;
  takeProfitPrice?: number | null;
  stopLossPrice?: number | null;
  onTakeProfitDrag?: (price: number) => void;
  onStopLossDrag?: (price: number) => void;
}

/**
 * Convert Hyperliquid candle to lightweight-charts format
 */
function toChartCandle(candle: Candle): CandlestickData<Time> {
  return {
    time: (candle.t / 1000) as Time, // Convert ms to seconds
    open: parseFloat(candle.o),
    high: parseFloat(candle.h),
    low: parseFloat(candle.l),
    close: parseFloat(candle.c),
  };
}

/**
 * TradingChart component using TradingView Lightweight Charts
 * Mobile-first design with full-width display
 */
export function TradingChart({
  coin,
  interval,
  onPriceClick,
  entryPrice,
  takeProfitPrice,
  stopLossPrice,
  onTakeProfitDrag,
  onStopLossDrag,
}: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  
  // Price lines refs
  const entryLineRef = useRef<ReturnType<ISeriesApi<"Candlestick">["createPriceLine"]> | null>(null);
  const tpLineRef = useRef<ReturnType<ISeriesApi<"Candlestick">["createPriceLine"]> | null>(null);
  const slLineRef = useRef<ReturnType<ISeriesApi<"Candlestick">["createPriceLine"]> | null>(null);

  const [isDragging, setIsDragging] = useState<"tp" | "sl" | null>(null);

  // Fetch candle data
  const { data: candles, isLoading } = useCandleSnapshotQuery({ coin, interval });

  // Initialize chart
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: "transparent" },
        textColor: "oklch(0.70 0.02 260)",
      },
      grid: {
        vertLines: { color: "oklch(0.22 0.02 260 / 0.5)" },
        horzLines: { color: "oklch(0.22 0.02 260 / 0.5)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "oklch(0.70 0.18 280 / 0.5)",
          labelBackgroundColor: "oklch(0.70 0.18 280)",
        },
        horzLine: {
          color: "oklch(0.70 0.18 280 / 0.5)",
          labelBackgroundColor: "oklch(0.70 0.18 280)",
        },
      },
      rightPriceScale: {
        borderColor: "oklch(0.22 0.02 260)",
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
        },
      },
      timeScale: {
        borderColor: "oklch(0.22 0.02 260)",
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: {
        vertTouchDrag: false, // Allow vertical scroll on mobile
      },
    });

    // Create candlestick series using v5 API
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "oklch(0.72 0.22 145)",
      downColor: "oklch(0.65 0.24 25)",
      borderUpColor: "oklch(0.72 0.22 145)",
      borderDownColor: "oklch(0.65 0.24 25)",
      wickUpColor: "oklch(0.72 0.22 145)",
      wickDownColor: "oklch(0.65 0.24 25)",
    });

    // Create volume series using v5 API
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: "oklch(0.70 0.18 280 / 0.3)",
      priceFormat: {
        type: "volume",
      },
      priceScaleId: "volume",
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.85,
        bottom: 0,
      },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    // Handle click for price selection
    chart.subscribeClick((param) => {
      if (param.point && onPriceClick && candleSeriesRef.current) {
        const price = candleSeriesRef.current.coordinateToPrice(param.point.y);
        if (price !== null) {
          onPriceClick(price);
        }
      }
    });

    // Handle resize
    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [onPriceClick]);

  // Update chart data
  useEffect(() => {
    if (!candles || !candleSeriesRef.current || !volumeSeriesRef.current) return;

    const chartCandles = candles.map(toChartCandle);
    const volumeData = candles.map((c) => ({
      time: (c.t / 1000) as Time,
      value: parseFloat(c.v),
      color:
        parseFloat(c.c) >= parseFloat(c.o)
          ? "oklch(0.72 0.22 145 / 0.5)"
          : "oklch(0.65 0.24 25 / 0.5)",
    }));

    candleSeriesRef.current.setData(chartCandles);
    volumeSeriesRef.current.setData(volumeData);

    // Auto-fit content
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, [candles]);

  // Manage price lines
  const updatePriceLine = useCallback(
    (
      lineRef: React.MutableRefObject<ReturnType<ISeriesApi<"Candlestick">["createPriceLine"]> | null>,
      price: number | null | undefined,
      options: Partial<PriceLineOptions>
    ) => {
      if (!candleSeriesRef.current) return;

      // Remove existing line
      if (lineRef.current) {
        candleSeriesRef.current.removePriceLine(lineRef.current);
        lineRef.current = null;
      }

      // Create new line if price is set
      if (price !== null && price !== undefined) {
        lineRef.current = candleSeriesRef.current.createPriceLine({
          price,
          lineStyle: LineStyle.Dashed,
          lineWidth: 2,
          axisLabelVisible: true,
          ...options,
        });
      }
    },
    []
  );

  // Update entry price line
  useEffect(() => {
    updatePriceLine(entryLineRef, entryPrice, {
      color: "oklch(0.70 0.18 280)",
      title: "Entry",
    });
  }, [entryPrice, updatePriceLine]);

  // Update take profit line
  useEffect(() => {
    updatePriceLine(tpLineRef, takeProfitPrice, {
      color: "oklch(0.72 0.22 145)",
      title: "TP",
      lineStyle: LineStyle.Dotted,
    });
  }, [takeProfitPrice, updatePriceLine]);

  // Update stop loss line
  useEffect(() => {
    updatePriceLine(slLineRef, stopLossPrice, {
      color: "oklch(0.65 0.24 25)",
      title: "SL",
      lineStyle: LineStyle.Dotted,
    });
  }, [stopLossPrice, updatePriceLine]);

  // Handle drag for TP/SL lines
  useEffect(() => {
    if (!chartRef.current || !candleSeriesRef.current) return;

    const handleCrosshairMove = (param: { point?: { x: number; y: number } }) => {
      if (!isDragging || !param.point || !candleSeriesRef.current) return;

      const price = candleSeriesRef.current.coordinateToPrice(param.point.y);
      if (price === null) return;

      if (isDragging === "tp" && onTakeProfitDrag) {
        onTakeProfitDrag(price);
      } else if (isDragging === "sl" && onStopLossDrag) {
        onStopLossDrag(price);
      }
    };

    chartRef.current.subscribeCrosshairMove(handleCrosshairMove);

    return () => {
      chartRef.current?.unsubscribeCrosshairMove(handleCrosshairMove);
    };
  }, [isDragging, onTakeProfitDrag, onStopLossDrag]);

  // Handle mouse/touch events for dragging
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!candleSeriesRef.current || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const price = candleSeriesRef.current.coordinateToPrice(y);
      if (price === null) return;

      // Check if click is near TP or SL line
      const tolerance = 10; // pixels
      if (takeProfitPrice !== null && takeProfitPrice !== undefined) {
        const tpY = candleSeriesRef.current.priceToCoordinate(takeProfitPrice);
        if (tpY !== null && Math.abs(y - tpY) < tolerance) {
          setIsDragging("tp");
          return;
        }
      }
      if (stopLossPrice !== null && stopLossPrice !== undefined) {
        const slY = candleSeriesRef.current.priceToCoordinate(stopLossPrice);
        if (slY !== null && Math.abs(y - slY) < tolerance) {
          setIsDragging("sl");
          return;
        }
      }
    },
    [takeProfitPrice, stopLossPrice]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-surface rounded-lg">
        <div className="animate-spin h-8 w-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[300px] touch-pan-y"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    />
  );
}

export default TradingChart;
