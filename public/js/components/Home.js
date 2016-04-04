import React from 'react';
import { InfinitList } from './InfinitList';
import { ProfilItem } from './ProfilItem';

export const Home = React.createClass({
  render() {
    return (
      <div className="home">
        <InfinitList
          elem={'ProfilItem'}
          list={[1, 2, 3, 4, 5]}
        />
      </div>
    );
  }
});
