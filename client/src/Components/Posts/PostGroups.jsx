import React from "react";
import "../../CSS/PostsList.css";
import PostGroupItem from "./PostGroupItem";

function PostGroups({ groupsList, handleSelectGroup, selectedGroups }) {

  
  return (
    <div id="postsListWrapper">
      <div id="PostsGroups">
        <h2 id="postTitle">Select Which Groups Can See This Item</h2>
        {groupsList.map((group, index) => {
          return (
            <PostGroupItem
              group={group}
              index={index}
              key={index}
              handleSelectGroup={() => handleSelectGroup(index)}
              selectedGroups={selectedGroups}
            />
          );
        })}
      </div>
    </div>
  );
}

export default PostGroups;
