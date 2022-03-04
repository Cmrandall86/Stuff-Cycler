import React from "react";
import "../../CSS/PostsList.css";
import PostListItem from "./PostListItem";
import { useEffect, useState } from "react";

function PostsList() {
  const [list, setList] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/posts")
      .then((response) => response.json())
      .then((data) => setList(data))
      .catch((error) => console.log(error));
  }, []);

  const onDeletePosts = (id) =>
    fetch(`http://localhost:8000/posts/${id}/delete`, { method: "DELETE" })
      .then((response) => response.json())
      .catch((error) => console.log(error));

  return (
    <div id="postsListWrapper">
      <div id="postsList">
        {list.map((post, index) => {
          return (
            <PostListItem
              post={post}
              onDeletePosts={() => onDeletePosts(post.id)}
              key={index}
            />
          );
        })}
      </div>
    </div>
  );
}

export default PostsList;
