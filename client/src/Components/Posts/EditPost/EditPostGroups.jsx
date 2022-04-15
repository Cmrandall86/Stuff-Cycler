import React from "react";
import "../../../CSS/PostsList.css";
import PostGroupItem from "./EditPostGroupItem";

function PostGroups({ groupsList, handleSelectGroup, post}) {

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
              handleSelectGroup={handleSelectGroup}
              isSelected={post.groups.includes(group.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

export default PostGroups;
