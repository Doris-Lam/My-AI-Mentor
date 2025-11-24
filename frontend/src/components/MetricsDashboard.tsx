import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { getCodeMetrics, type CodeMetricsResponse } from '../services/api';
import { Activity, Code, FileText, TrendingUp, AlertCircle, Info, Package, Download, Gauge } from 'lucide-react';

interface MetricsDashboardProps {
  code: string;
  language: string;
  darkMode: boolean;
}

const COLORS = {
  light: {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    background: '#ffffff',
    text: '#1f2937',
  },
  dark: {
    primary: '#60a5fa',
    secondary: '#a78bfa',
    success: '#34d399',
    warning: '#fbbf24',
    danger: '#f87171',
    background: '#1f2937',
    text: '#f9fafb',
  },
};

export default function MetricsDashboard({ code, language, darkMode }: MetricsDashboardProps) {
  const [metrics, setMetrics] = useState<CodeMetricsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const colors = darkMode ? COLORS.dark : COLORS.light;

  useEffect(() => {
    if (!code.trim()) {
      setMetrics(null);
      return;
    }

    const fetchMetrics = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getCodeMetrics({ code, language });
        setMetrics(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to calculate metrics');
        setMetrics(null);
      } finally {
        setLoading(false);
      }
    };

    // Debounce the API call
    const timeoutId = setTimeout(fetchMetrics, 500);
    return () => clearTimeout(timeoutId);
  }, [code, language]);

  if (loading) {
    return (
      <div className="metrics-dashboard loading">
        <div className="loading-spinner">
          <Activity className="animate-spin" size={24} />
          <span>Calculating metrics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="metrics-dashboard error">
        <AlertCircle size={20} />
        <span>{error}</span>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="metrics-dashboard empty">
        <Code size={24} />
        <p>Start writing code to see metrics</p>
      </div>
    );
  }

  // Prepare data for charts
  const codeDistributionData = [
    { name: 'Code', value: metrics.code_lines, color: colors.primary },
    { name: 'Comments', value: metrics.comment_lines, color: colors.secondary },
    { name: 'Blank', value: metrics.blank_lines, color: colors.warning },
  ];

  const structureData = [
    { name: 'Functions', value: metrics.function_count },
    { name: 'Classes', value: metrics.class_count },
    { name: 'Imports', value: metrics.import_count },
  ];

  const complexityData = [
    { name: 'Complexity', value: metrics.complexity },
    { name: 'Max Nesting', value: metrics.max_nesting_depth },
  ];

  const lineLengthData = [
    { name: 'Average', value: metrics.avg_line_length },
    { name: 'Longest', value: metrics.longest_line },
  ];

  // Get complexity rating
  const getComplexityRating = (complexity: number) => {
    if (complexity <= 10) return { label: 'Low', color: colors.success };
    if (complexity <= 20) return { label: 'Medium', color: colors.warning };
    return { label: 'High', color: colors.danger };
  };

  const complexityRating = getComplexityRating(metrics.complexity);

  return (
    <div className="metrics-dashboard">
      {/* Key Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">
            <FileText size={20} />
          </div>
          <div className="metric-content">
            <div className="metric-label">
              Total Lines
              <span className="metric-info-tooltip" title="Total number of lines including code, comments, and blank lines">
                <Info size={14} />
              </span>
            </div>
            <div className="metric-value">{metrics.total_lines.toLocaleString()}</div>
            <div className="metric-detail">
              {metrics.code_lines} code • {metrics.comment_lines} comments • {metrics.blank_lines} blank
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <Code size={20} />
          </div>
          <div className="metric-content">
            <div className="metric-label">
              Code Lines
              <span className="metric-info-tooltip" title="Lines containing actual executable code (excluding comments and blank lines)">
                <Info size={14} />
              </span>
            </div>
            <div className="metric-value">{metrics.code_lines.toLocaleString()}</div>
            <div className="metric-detail">{metrics.code_percentage.toFixed(1)}% of total</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <Gauge size={20} />
          </div>
          <div className="metric-content">
            <div className="metric-label">
              Complexity
              <span className="metric-info-tooltip" title="Cyclomatic complexity: counts decision points (if, for, while, etc.). Lower is better.">
                <Info size={14} />
              </span>
            </div>
            <div className="metric-value-with-badge">
              <span className="metric-value">{metrics.complexity}</span>
              <span className="complexity-badge" data-rating={complexityRating.label.toLowerCase()}>
                {complexityRating.label}
              </span>
            </div>
            <div className="metric-detail">Max nesting: {metrics.max_nesting_depth} levels</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <TrendingUp size={20} />
          </div>
          <div className="metric-content">
            <div className="metric-label">
              Avg Line Length
              <span className="metric-info-tooltip" title="Average number of characters per line. Recommended: 80-100 characters">
                <Info size={14} />
              </span>
            </div>
            <div className="metric-value">{metrics.avg_line_length.toFixed(0)}</div>
            <div className="metric-detail">Longest: {metrics.longest_line} chars</div>
          </div>
        </div>
      </div>

      {/* Code Structure Cards */}
      <div className="structure-cards">
        <div className="structure-card">
          <div className="structure-icon">
            <Code size={18} />
          </div>
          <div className="structure-content">
            <div className="structure-value">{metrics.function_count}</div>
            <div className="structure-label">Functions</div>
          </div>
        </div>
        <div className="structure-card">
          <div className="structure-icon">
            <Package size={18} />
          </div>
          <div className="structure-content">
            <div className="structure-value">{metrics.class_count}</div>
            <div className="structure-label">Classes</div>
          </div>
        </div>
        <div className="structure-card">
          <div className="structure-icon">
            <Download size={18} />
          </div>
          <div className="structure-content">
            <div className="structure-value">{metrics.import_count}</div>
            <div className="structure-label">Imports</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        {/* Code Distribution Pie Chart */}
        <div className="chart-container">
          <div className="chart-header">
            <h3>Code Distribution</h3>
            <span className="chart-info-tooltip" title="Breakdown of code lines, comments, and blank lines">
              <Info size={16} />
            </span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={codeDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent, value }) => `${name}\n${value} (${percent ? (percent * 100).toFixed(0) : 0}%)`}
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
                animationDuration={800}
              >
                {codeDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Structure Bar Chart */}
        <div className="chart-container">
          <div className="chart-header">
            <h3>Code Structure</h3>
            <span className="chart-info-tooltip" title="Count of functions, classes, and import statements">
              <Info size={16} />
            </span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={structureData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.3} />
              <XAxis 
                dataKey="name" 
                stroke="var(--text-secondary)"
                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
              />
              <YAxis 
                stroke="var(--text-secondary)"
                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                }}
                cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
              />
              <Bar 
                dataKey="value" 
                fill={colors.primary} 
                radius={[8, 8, 0, 0]}
                animationDuration={800}
              >
                {structureData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={[colors.primary, colors.secondary, colors.success][index]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Complexity Comparison */}
        <div className="chart-container">
          <div className="chart-header">
            <h3>Complexity Metrics</h3>
            <span className="chart-info-tooltip" title="Cyclomatic complexity and maximum nesting depth">
              <Info size={16} />
            </span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={complexityData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} opacity={0.3} />
              <XAxis 
                dataKey="name" 
                stroke={colors.text}
                tick={{ fill: colors.text, fontSize: 12 }}
              />
              <YAxis 
                stroke={colors.text}
                tick={{ fill: colors.text, fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: colors.background,
                  border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                  borderRadius: '8px',
                  color: colors.text,
                }}
                cursor={{ fill: `${colors.secondary}10` }}
              />
              <Bar 
                dataKey="value" 
                fill={colors.secondary} 
                radius={[8, 8, 0, 0]}
                animationDuration={800}
              >
                {complexityData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? colors.secondary : colors.warning} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Line Length Metrics */}
        <div className="chart-container">
          <div className="chart-header">
            <h3>Line Length</h3>
            <span className="chart-info-tooltip" title="Average and maximum line length in characters">
              <Info size={16} />
            </span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={lineLengthData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} opacity={0.3} />
              <XAxis 
                dataKey="name" 
                stroke={colors.text}
                tick={{ fill: colors.text, fontSize: 12 }}
              />
              <YAxis 
                stroke={colors.text}
                tick={{ fill: colors.text, fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: colors.background,
                  border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                  borderRadius: '8px',
                  color: colors.text,
                }}
                cursor={{ fill: `${colors.warning}10` }}
              />
              <Bar 
                dataKey="value" 
                fill={colors.warning} 
                radius={[8, 8, 0, 0]}
                animationDuration={800}
              >
                {lineLengthData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? colors.warning : colors.danger} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="stats-section">
        <h3>Additional Statistics</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Total Characters</span>
            <span className="stat-value">{metrics.characters.toLocaleString()}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Characters (no whitespace)</span>
            <span className="stat-value">{metrics.characters_no_whitespace.toLocaleString()}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Comment Ratio</span>
            <span className="stat-value">{metrics.comment_percentage.toFixed(1)}%</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Code Ratio</span>
            <span className="stat-value">{metrics.code_percentage.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* How Metrics Are Calculated */}
      <div className="metrics-explanation">
        <div className="explanation-header">
          <Info size={18} />
          <h3>How Metrics Are Calculated</h3>
        </div>
        <div className="explanation-content">
          <div className="explanation-item">
            <strong>Lines of Code:</strong> Counted by analyzing each line - code lines contain executable statements, 
            comment lines start with language-specific comment markers (#, //, /*, etc.), and blank lines are empty.
          </div>
          <div className="explanation-item">
            <strong>Functions/Classes/Imports:</strong> Detected using language-specific patterns. For Python, we use AST parsing 
            for accuracy. For other languages, we use regex patterns to find function definitions, class declarations, and import statements.
          </div>
          <div className="explanation-item">
            <strong>Complexity:</strong> Cyclomatic complexity is calculated by counting decision points (if, else, for, while, 
            switch, catch, &&, ||, ternary operators). Base complexity starts at 1, and each decision point adds 1.
          </div>
          <div className="explanation-item">
            <strong>Nesting Depth:</strong> Calculated by tracking indentation levels. The maximum nesting depth shows how deeply 
            nested your code structures are (functions within classes, loops within conditionals, etc.).
          </div>
          <div className="explanation-item">
            <strong>Line Length:</strong> Average line length is the mean number of characters per non-blank line. 
            The longest line shows the maximum characters in any single line.
          </div>
        </div>
      </div>
    </div>
  );
}

