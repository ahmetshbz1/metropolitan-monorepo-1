import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Application from 'expo-application';
import { useTranslation } from 'react-i18next';
import { withTranslation, WithTranslation } from 'react-i18next';

interface Props extends WithTranslation {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
  lastErrorTime: number;
}

/**
 * Global Error Boundary for React Native
 * Catches JavaScript errors anywhere in the child component tree
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      lastErrorTime: 0,
    };
  }

  static getDerivedStateFromError(_error: Error): Partial<State> {
    // Update state to render error UI
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const now = Date.now();
    const { errorCount, lastErrorTime } = this.state;

    // Prevent error loops - if too many errors in short time, don't update
    if (errorCount > 5 && now - lastErrorTime < 1000) {
      // Removed console statement
      return;
    }

    // Log error to console in development
    if (__DEV__) {
      // Removed console statement
    }

    // Update state with error details
    this.setState({
      error,
      errorInfo,
      errorCount: errorCount + 1,
      lastErrorTime: now,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you might want to log to an error reporting service
    // Example: Sentry, Bugsnag, etc.
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // This is where you'd send the error to your error tracking service
    // For now, we'll just log it
    const errorData = {
      message: error.toString(),
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      appVersion: Application.nativeApplicationVersion,
      buildVersion: Application.nativeBuildVersion,
    };

    // In production, send this to your error tracking service
    if (!__DEV__) {
      // Example: sendErrorToSentry(errorData);
      // Removed console statement
    }
  };

  handleReset = () => {
    // Reset error boundary state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      lastErrorTime: 0,
    });
  };

  handleReload = async () => {
    try {
      // In development and when Updates is disabled, just reset the error boundary
      this.handleReset();
    } catch (error) {
      // Removed console statement
      this.handleReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // If custom fallback is provided, use it
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      // Default error UI
      return (
        <SafeAreaView style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Error Icon */}
            <View style={styles.iconContainer}>
              <Ionicons name="warning-outline" size={80} color="#FF6B6B" />
            </View>

            {/* Error Title */}
            <Text style={styles.title}>{this.props.t('errors.ERROR_BOUNDARY_TITLE')}</Text>

            {/* Error Description */}
            <Text style={styles.description}>
              {this.props.t('errors.ERROR_BOUNDARY_DESCRIPTION')}
            </Text>

            {/* Error Details (only in dev) */}
            {__DEV__ && this.state.error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorTitle}>Hata Detayları:</Text>
                <Text style={styles.errorMessage}>
                  {this.state.error.toString()}
                </Text>
                {this.state.error.stack && (
                  <ScrollView style={styles.stackTrace} nestedScrollEnabled>
                    <Text style={styles.stackText}>
                      {this.state.error.stack}
                    </Text>
                  </ScrollView>
                )}
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={this.handleReload}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={20} color="white" />
                <Text style={styles.primaryButtonText}>{this.props.t('errors.ERROR_BOUNDARY_RELOAD')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={this.handleReset}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-back" size={20} color="#007AFF" />
                <Text style={styles.secondaryButtonText}>{this.props.t('errors.ERROR_BOUNDARY_RETRY')}</Text>
              </TouchableOpacity>
            </View>

            {/* Support Info */}
            <View style={styles.supportInfo}>
              <Text style={styles.supportText}>
                {this.props.t('errors.ERROR_BOUNDARY_SUPPORT')}
              </Text>
              <Text style={styles.supportEmail}>{this.props.t('errors.ERROR_BOUNDARY_SUPPORT_EMAIL')}</Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      );
    }

    // No error, render children normally
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  errorDetails: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    maxHeight: 300,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 12,
    color: '#FF6B6B',
    marginBottom: 12,
    fontFamily: 'monospace',
  },
  stackTrace: {
    maxHeight: 200,
  },
  stackText: {
    fontSize: 10,
    color: '#666666',
    fontFamily: 'monospace',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 32,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  supportInfo: {
    alignItems: 'center',
  },
  supportText: {
    fontSize: 14,
    color: '#999999',
    marginBottom: 8,
    textAlign: 'center',
  },
  supportEmail: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
});

export default withTranslation()(ErrorBoundary);
