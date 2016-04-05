require('../styles/DocumentItem.scss');

import React from 'react';

export const DocumentItem = React.createClass({
  render() {
    const document = this.props.item._source;
    return (
      <div className="document-item-container">
        <div className="tweet">{document.twitText}</div>
        <div className="title">
          <a target="_blank" href={document.true_url}>{document.title}</a>
        </div>
        <div className="twitterId">Posted by {document.twitterScreenName}</div>
        <div className="score">Score : {document.nbWord}</div>
      </div>
    );
  }
});
