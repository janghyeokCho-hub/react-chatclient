import React, { Component } from 'react';
import { connect } from 'react-redux';
import ErrorPage from '@COMMON/ErrorPage';

import { set } from '@/modules/error';

class ErrorBoundary extends Component {
  componentDidCatch(error, info) {
    // Display fallback UI
    const { set } = this.props;
    set({ error: true, object: error });
    // You can also log the error to an error reporting service
  }

  render() {
    return (
      <>
        {!this.props.error && this.props.children}
        {this.props.error && <ErrorPage></ErrorPage>} {/* 공통 ERROR 페이지 */}
      </>
    );
  }
}

export default connect(
  ({ error }) => ({
    error: error.error,
  }),
  { set },
)(ErrorBoundary);
