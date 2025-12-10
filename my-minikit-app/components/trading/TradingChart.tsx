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
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  
  // Price lines refs
  const entryLineRef = useRef<ReturnType<ISeriesApi<"Candlestick">["createPriceLine"]> | null>(null);
  const tpLineRef = useRef<ReturnType<ISeriesApi<"Candlestick">["createPriceLine"]> | null>(null);
  const slLineRef = useRef<ReturnType<ISeriesApi<"Candlestick">["createPriceLine"]> | null>(null);
  const clickHandlerRef = useRef<((param: { point?: { x: number; y: number } }) => void) | null>(null);

  const [isDragging, setIsDragging] = useState<"tp" | "sl" | null>(null);
  const [containerElement, setContainerElement] = useState<HTMLDivElement | null>(null);

  // Fetch candle data
  const { data: candles, isLoading } = useCandleSnapshotQuery({ coin, interval });

  // Initialize chart
  useEffect(() => {
    if (!containerElement) return;

    // Avoid re-initializing if already initialized
    if (chartRef.current) return;

    // Note: lightweight-charts canvas doesn't support oklch colors
    // Using hex equivalents of our oklch theme colors
    const chart = createChart(containerElement, {
      layout: {
        background: { color: "transparent" },
        textColor: "#9ca3af", // text-secondary equivalent
      },
      grid: {
        vertLines: { color: "rgba(55, 65, 81, 0.5)" }, // surface-elevated with opacity
        horzLines: { color: "rgba(55, 65, 81, 0.5)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "rgba(139, 92, 246, 0.8)", // accent with more opacity
          labelBackgroundColor: "#8b5cf6", // accent
          width: 1,
          style: 0, // Solid line
          labelVisible: true,
        },
        horzLine: {
          color: "rgba(139, 92, 246, 0.8)",
          labelBackgroundColor: "#8b5cf6",
          width: 1,
          style: 0, // Solid line
          labelVisible: true,
        },
      },
      rightPriceScale: {
        borderColor: "#374151", // surface-elevated
        scaleMargins: {
          top: 0.1, // 10% margin at top
          bottom: 0.25, // 25% margin at bottom for volume
        },
        autoScale: true, // Auto-scale to fit visible data
      },
      leftPriceScale: {
        visible: false, // Hide left scale (used for volume)
      },
      timeScale: {
        borderColor: "#374151",
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 12, // More space on the right like TradingView
        barSpacing: 6, // Spacing between bars
        minBarSpacing: 0.5, // Minimum spacing when zoomed in
        fixLeftEdge: false, // Allow scrolling past the first bar
        fixRightEdge: false, // Allow scrolling past the last bar
      },
      handleScroll: {
        vertTouchDrag: false, // Allow vertical scroll on mobile
      },
    });

    // Create candlestick series using v5 API
    // Using hex colors: green (#22c55e) for up, red (#ef4444) for down
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    // Create volume series using v5 API
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: "rgba(139, 92, 246, 0.3)", // accent with opacity
      priceFormat: {
        type: "volume",
      },
      priceScaleId: "left", // Use hidden left scale for volume
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8, // Volume takes bottom 20% of chart
        bottom: 0,
      },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    // Handle resize
    const handleResize = () => {
      if (containerElement && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerElement.clientWidth,
          height: containerElement.clientHeight,
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
  }, [containerElement]); // Re-run when container element is set

  // Update click handler when onPriceClick changes
  useEffect(() => {
    if (!chartRef.current || !candleSeriesRef.current) return;

    // Remove previous handler if it exists
    if (clickHandlerRef.current && chartRef.current) {
      chartRef.current.unsubscribeClick(clickHandlerRef.current);
    }

    // Create new handler with updated callback
    const handleClick = (param: { point?: { x: number; y: number } }) => {
      if (param.point && onPriceClick && candleSeriesRef.current) {
        const price = candleSeriesRef.current.coordinateToPrice(param.point.y);
        if (price !== null) {
          onPriceClick(price);
        }
      }
    };

    // Store reference and subscribe
    clickHandlerRef.current = handleClick;
    chartRef.current.subscribeClick(handleClick);

    return () => {
      // Unsubscribe using the stored reference
      if (clickHandlerRef.current && chartRef.current) {
        chartRef.current.unsubscribeClick(clickHandlerRef.current);
        clickHandlerRef.current = null;
      }
    };
  }, [onPriceClick]);

  // Track if this is initial data load
  const isInitialLoadRef = useRef(true);
  const previousCandlesLengthRef = useRef(0);

  // Update chart data
  useEffect(() => {
    if (!candles || candles.length === 0 || !candleSeriesRef.current || !volumeSeriesRef.current) {
      return;
    }

    // Sort candles by timestamp ascending (required by lightweight-charts)
    const sortedCandles = [...candles].sort((a, b) => a.t - b.t);
    
    const chartCandles = sortedCandles.map(toChartCandle);
    const volumeData = sortedCandles.map((c) => ({
      time: (c.t / 1000) as Time,
      value: parseFloat(c.v),
      color:
        parseFloat(c.c) >= parseFloat(c.o)
          ? "rgba(34, 197, 94, 0.5)" // green with opacity
          : "rgba(239, 68, 68, 0.5)", // red with opacity
    }));

    try {
      const isInitial = isInitialLoadRef.current || previousCandlesLengthRef.current === 0;
      const hasNewCandles = sortedCandles.length !== previousCandlesLengthRef.current;
      
      if (isInitial || hasNewCandles) {
        // Use setData() when we have new candles or on initial load
        candleSeriesRef.current.setData(chartCandles);
        volumeSeriesRef.current.setData(volumeData);
        
        // Only fit content on initial load
        if (isInitialLoadRef.current) {
          if (chartRef.current) {
            chartRef.current.timeScale().fitContent();
          }
          isInitialLoadRef.current = false;
        }
      } else {
        // Use update() for real-time updates to existing candles
        const lastCandle = chartCandles[chartCandles.length - 1];
        const lastVolume = volumeData[volumeData.length - 1];
        
        if (lastCandle && lastVolume) {
          candleSeriesRef.current.update(lastCandle);
          volumeSeriesRef.current.update(lastVolume);
        }
      }
      
      previousCandlesLengthRef.current = sortedCandles.length;
    } catch (err) {
      console.error("Error setting chart data:", err);
    }
  }, [candles]);

  // Reset initial load flag when coin or interval changes
  useEffect(() => {
    isInitialLoadRef.current = true;
    previousCandlesLengthRef.current = 0;
  }, [coin, interval]);

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
      color: "#8b5cf6", // accent purple
      title: "Entry",
    });
  }, [entryPrice, updatePriceLine]);

  // Update take profit line
  useEffect(() => {
    updatePriceLine(tpLineRef, takeProfitPrice, {
      color: "#22c55e", // green
      title: "TP",
      lineStyle: LineStyle.Dotted,
    });
  }, [takeProfitPrice, updatePriceLine]);

  // Update stop loss line
  useEffect(() => {
    updatePriceLine(slLineRef, stopLossPrice, {
      color: "#ef4444", // red
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
      if (!candleSeriesRef.current || !containerElement) return;

      const rect = containerElement.getBoundingClientRect();
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
    [containerElement, takeProfitPrice, stopLossPrice]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  if (isLoading || !candles || candles.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-surface rounded-lg min-h-[300px]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-xs text-text-muted">
            {isLoading ? "Loading chart..." : "No data available"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setContainerElement}
      className="w-full h-full min-h-[300px] touch-pan-y"
      style={{ position: "relative" }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    />
  );
}

export default TradingChart;
