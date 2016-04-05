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
          fetchProfiles={this.props.fetchProfiles}
        />
      </div>
    );
  }
});
