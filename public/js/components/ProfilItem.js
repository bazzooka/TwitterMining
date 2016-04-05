import React from 'react';

export const ProfilItem = React.createClass({
  render() {
    const profil = this.props.profil._source;
    return (
      <div className="profil-item-container">
        <div className="avatar">
          <img src={`https://twitter.com/${profil.screen_name}/profile_image?size=original`}/>
        </div>
        <div className="name">{profil.screen_name}</div>
        <div className="ratio">{profil.ratio}</div>
        <div className="nbDocument">{profil.nbDocument}</div>
        <div className="scoreTotal">{profil.scoreTotal}</div>
      </div>
    );
  }
});
