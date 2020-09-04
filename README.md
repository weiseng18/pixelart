# pixelart
generate PNG from user-created pixel art



## commit messages

For organization, all commits after [this](https://github.com/weiseng18/pixelart/commit/3d8a28c421e37e8f45e085a4cde2a412296ce7fe) will have the following format:

`[scope] description`

where `scope` will be one of the following items:

* `icon add/revise` for addition/revision of icons/`.pix` files
* `bug-fix` for bug fixes
* `tool add/revise` for addition/revision of tools
* `save add/revise` for addition/revision of saving/loading
* `feature` for general new features added/revised
* `feature prep` for changes made that prepare for the introduction of a feature
  * as such, such commits may create new, unresponsive areas, but these commits will not be pushed to master until the whole feature is complete
    * examples include adjustments in CSS properties / introduction of new HTML elements
  * another type would be addition to helper functions/modification of current functions in such a way that does not affect the end result, but allows more flexibility to incorporate future features
* `code` for
  * improvements in code efficiency
  * addition/revision of comments
  * changes in variable names
* `external` for commits that only add/link external libraries
* `css` for commits changing .css files
  * renaming of class names
  * creating classes to set CSS attributes of javascript-created elements
* `README` for updating this `README.md` file
* if necessary, or to condense very minor changes, `scope1 + scope2` can be used
  * e.g. `tool add + code` for creating a new tool but reordering the current tools instead of appending this new tool at the back



### Example (using this commit of creating this section in README):

`git commit -m "[README] created a section: commit messages, so that each commit can have its scope mentioned at the start of its commit message, in order for better organization"`



The above list is not exhaustive and will be revised when necessary. This is to ensure that each commit tries to work on one item at a time, so that changes can be seen more clearly.

