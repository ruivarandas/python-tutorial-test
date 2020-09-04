Learning
========

This is a Jupyter Notebook extension intended to be used by students or people interested in learning a specific subject. The basic function of the extension is to only allow the advancement of a student after they finish the present exercise with success. Thus, each exercise cell should have in its metadata `"solved": false` and `"test": false`. Furthermore, code cells that serve as example and that should not be edited by the user, should have in its metadata `"example": true`.

The test cells should be composed of code testing the previous exercise. These cells should have in their metadata `"test": true` in order to be distinguishable. These cells are hidden when the extension is __enabled__ and are not accessible. Thus, it is suggestable that you make the notebook with the extension __disabled__ and only when the user is performing the exercises should it be __enabled__.

Once the extension is enabled, the non-code cells are not editable, it is not possible to add or remove cells, all actions under Edit are disabled, the type of cell is not changeable and only the cells until the last __solved__ cell are visible to the user.

For an exercise to be considered correct and the next code cell appear and be enabled/editable, the _test cell_ should have a print containing the word `Passed`. If the solution is not correct, then the print should contain the word `Failed`. A good way to perform the test is to use the `assert` method in Python.

Finally, if a template is user, the cells corresponding to the template should have in the metadata `"template": true`, in order to be visible at all times.

This allows for a _step-by-step_ procedure, where the user needs to complete the easier (first) exercises in order to try the more challenging ones.



### Installation
To install this Jupyter extension, place the folder containing the files of this repository in __~\Anaconda\Lib\site-packages\jupyter_contrib_nbextensions\nbextensions\\\<extension-folder>__ and then run: `jupyter contrib nbextensions install`.
After that, activate the extension with the name _Learning_ from the menu __Nbextensions__ in the Jupyter interface.
