import React from "react";
import "../../CSS/PostsList.css";
import PostListItem from "./PostListItem";

function PostsList({ list, onDeletePosts }) {

  return (
    <div id="postsListWrapper">
      <div id="postsList">
        {list.map((post, index) => {
          return <PostListItem post={post} onDeletePosts={()=>onDeletePosts(index)} key={index} />;
        })}
      </div>
    </div>
  );
}

export default PostsList;
