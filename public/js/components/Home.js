import React from 'react';
import { InfinitList } from './InfinitList';
import { ProfilItem } from './ProfilItem';

export const Home = React.createClass({
  render() {
    return (
      <div className="home">
        <InfinitList
          elem={'ProfilItem'}
          list={this.props.profiles}
          fetchMethod={this.props.fetchProfiles}
        />
        <InfinitList
          elem={'DocumentItem'}
          list={this.props.documents}
          fetchMethod={this.props.fetchDocuments}
        />
      </div>
    );
  }
});
