import React from 'react';
import { ProfilItem } from './ProfilItem';

const ListItems = {
  ProfilItem
};

export const InfinitList = React.createClass({
  render() {
    const elts = this.props.list.map((elt, key) => (
      React.createElement(ListItems.ProfilItem, { key })
    ));
    return (
      <div className="infinit-list-container">
        {elts}
      </div>
    );
  }
});
