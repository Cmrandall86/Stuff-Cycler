import React from "react";
import "../../CSS/PostsList.css";
import PostGroupItem from "./PostGroupItem";

function PostGroups({ list }) {
  return (
    <div id="postsListWrapper">
      <div id="PostsGroups">
          <h2 id="postTitle">Select Which Groups Can See This Item</h2>
        {list.map((group, index) => {
          return <PostGroupItem group={group} key={index} />;
        })}
      </div>
    </div>
  );
}

export default PostGroups;
