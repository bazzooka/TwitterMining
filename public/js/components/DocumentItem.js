require('../styles/DocumentItem.scss');

import React from 'react';

export const DocumentItem = React.createClass({
  render() {
    const document = this.props.item._source;
    console.log(document);
    return (
      <div className="document-item-container">
        <div className="title">
          <a target="_blank" href={document.true_url}>{document.title}</a>
        </div>
        <div className="twitterId">Posted by {document.twitterUserId}</div>
        <div className="score">Score : {document.nbWord}</div>
      </div>
    );
  }
});
