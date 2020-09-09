// Adds a button to hide the input part of the currently selected cells

define([
    'jquery',
    'base/js/namespace',
    'base/js/events',
    'notebook/js/outputarea'
], function(
    $,
    Jupyter,
    events,
    oa,
) {
    "use strict";

    var check_passed = function () {
        var old_handle_output = oa.OutputArea.prototype.handle_output;
        oa.OutputArea.prototype.handle_output = function (msg) {
            
            if(msg.content.text != undefined){
                if(msg.content.text.includes("Passed")){
                    var color = "#1ed43c";

                    var cell = Jupyter.notebook.get_selected_cell()
                    cell.metadata.solved = false
                    while(cell.cell_type != 'code' || cell.metadata.example == true){
                        var old_cell = cell
                        Jupyter.notebook.select_next();
                        var cell = Jupyter.notebook.get_selected_cell()
                        if (cell==old_cell){break}
                        if(cell.cell_type == 'code'){cell.execute()}
                        cell.metadata.solved = false
                    }
                    if(cell.cell_type == 'code'){
                        if(cell.metadata.test!=undefined && cell.metadata.test){Jupyter.notebook.select_prev(); cell = Jupyter.notebook.get_selected_cell()}
                        cell.element.find("textarea").prop('disabled', false);
                        cell.metadata.solved = true
                    }

                } else if(msg.content.text.includes("Failed")) {
                    var color = "#f00202"
                } else {
                    var color = "#ffffff"
                }
                change_children_color(this.element[0], color)
                change_children_color(this.selector[0], color)
                
                show_solved_cells();
            }
            return old_handle_output.apply(this, arguments);
        };
    };
    
    var change_children_color = function(parent, color){
        var children = parent.children;
        for (var i = 0; i < children.length; i++) {
            children[i].style.backgroundColor = color;
        }
    }

    var toggle_selected_input = function () {
        // Find all cells
        Jupyter.notebook.get_cells().forEach(function(cell) {
            // Toggle visibility of the input div
            if ((cell.metadata.test != undefined && cell.metadata.test) || (cell.metadata.hide != undefined && cell.metadata.hide)) { 
                cell.element.find("div.input").toggle('slow');
                // cell.metadata.test = !cell.metadata.test;
            }
        })
    };

    var update_input_visibility = function (begin) {
        // Hide cells with test: true metadata
        var first_code_cell = true
        let id = 0
        Jupyter.notebook.get_cells().forEach(function(cell) {
            if(cell.cell_type == 'code' && !cell.metadata.example && !cell.metadata.test && !cell.metadata.hide && first_code_cell){
                // console.log(cell)
                cell.metadata.solved = true;
                first_code_cell = false
            } else {
                cell.metadata.solved = false;
            }
            cell.metadata.undeletable = true
            cell.metadata.deletable = false
            cell.element[0].id = id
            id++

            if (cell.cell_type != "code" || (cell.metadata.example != undefined && cell.metadata.example)){
                cell.rendered = false
                cell.metadata.editable = false
            }
            if ((cell.metadata.test || cell.metadata.hide) && begin) {
                cell.element.find("div.input").hide();
            }
        })
    };

    var disable_div = function(id){
        $('#' + id).append('<div class="disabled-div" style="position: absolute;top:0;left:0;width: 100%;height:100%;z-index:2;opacity:0.4;filter: alpha(opacity = 50); background-color:white"></div>');
    }

    var disable_default_div = function() {
        var buttons = ['move_up_down', 'insert_above_below', 'cut_copy_paste', 'cell_type', 'edit_menu', 'menu-cell-toolbar-submenu', 'to_code', 'to_markdown', 'to_raw', 'btn-hide-input']
        for(var i = 0; i < buttons.length; i++){disable_div(buttons[i])}
    }

    var enable_div = function(){
        while(document.getElementsByClassName("disabled-div").length != 0){
            var elements_to_remove = document.getElementsByClassName("disabled-div")
            console.log(elements_to_remove)
            for(var i = 0; i < elements_to_remove.length; i++){
                elements_to_remove[i].remove();
            }
        }
    }

    var disable_extension = function () {
        // Hide cells with test: true metadata
        Jupyter.notebook.get_cells().forEach(function(cell) {
            cell.metadata.undeletable = false
            cell.metadata.deletable = true
            cell.metadata.editable = true
            if (cell.cell_type != "code" || (cell.metadata.example != undefined && cell.metadata.example)){
                cell.metadata.editable = true
                cell.rendered = true
            }
            cell.element.find("textarea").prop('disabled', false)
            cell.element.show();
        })
    };

    var disable_cells = function() {
        // Disable all code cells that are «"solved": false» in the metadata when loading the notebook.
        // If there is no solved field in the metadata, disable the cell and add the tag in the metadata.
        var flag = 0
        Jupyter.notebook.get_cells().forEach(function(cell) {
            if (cell.metadata.solved || cell.metadata.solved == undefined ) {
                cell.element.find("textarea").prop('disabled', false);
            } else if(!cell.metadata.solved || cell.metadata.solved != undefined  || (cell.metadata.example != undefined && cell.metadata.example ==true)){
                cell.element.find("textarea").prop('disabled',true);
            }
            
            if (cell.cell_type == "code" && flag == 0){cell.element.find("textarea").prop('disabled', false); flag=1}
        })
    }

    var show_solved_cells = function() {
        let last_solved = null
        let all_cells = Jupyter.notebook.get_cells()

        Jupyter.notebook.get_cells().forEach(function(cell){
            let index = all_cells.indexOf(cell)
            if (cell.metadata.solved){ last_solved = index }
        })
        Jupyter.notebook.get_cells().forEach(function(cell){
            let index = all_cells.indexOf(cell)
            if (index > last_solved + 1 && (!cell.metadata.template || cell.metadata.template != undefined)) { cell.element.hide(); }
            if (index <= last_solved + 1 || cell.metadata.template || cell.metadata.template != undefined) { cell.element.show(); }
        })
    }

    var check_solution = function () {
        // In this function, we should check if the output of the current running cell is checked by the next (that should be test)
        // First, we need to check if the next cell is a test cell and only then we run it (the user might add new cells)
        // The output of the cell should be a message in Green saying "Passed" or in Red saying "Failed".

        var cell = Jupyter.notebook.get_selected_cell()

        if(cell.cell_type == "code" && (!cell.metadata.test || cell.metadata.test == undefined)){
            Jupyter.notebook.select_next()
            var new_cell = Jupyter.notebook.get_selected_cell()
        } else if(cell.cell_type == "code" && cell.metadata.test) {
            var new_cell = cell
        } else {
            return null;
        }
        
        if(new_cell.metadata.test){
            new_cell.execute(true)
            check_passed()
        }
    }

    var load_ipython_extension = function() {
        var begin = true
        // Add a button to the toolbar
        $(Jupyter.toolbar.add_buttons_group([
            Jupyter.keyboard_manager.actions.register({
                help   : 'Hide selected code cells',
                icon   : 'fa-chevron-up',
                handler: function() {
                    toggle_selected_input();
                    if (general_flag) {
                        console.log("INVISIBILITY")
                        update_input_visibility();
                        disable_cells();
                        check_passed();
                        disable_default_div();
                        show_solved_cells();
                        setTimeout(function() { $('#btn-hide-input').blur(); }, 500);
                        general_flag = false;
                    } else {
                        console.log("DISABLE EXTENSION")
                        disable_extension();
                        enable_div()
                        general_flag = true;
                    }
                }
            }, 'toggle-cell-input-display', 'test')
        ])).find('.btn').attr('id', 'btn-hide-input');

        if (Jupyter.notebook !== undefined && Jupyter.notebook._fully_loaded) {
            // notebook already loaded. Update directly
            update_input_visibility(true);
            disable_cells();
            check_passed();
            disable_default_div()

            var general_flag = false
        }
        var new_cell = true
        events.on("notebook_loaded.Notebook", update_input_visibility);
        events.on("create.Cell", function(e, msg) {
            //console.log(e,msg, new_cell)
            if(msg.cell.metadata.undeletable == undefined && new_cell && !general_flag){
                Jupyter.notebook.delete_cell(msg.index)
            }
            new_cell = true;
        })

        events.on("delete.Cell", function(e, msg) {
            if(msg.cell.metadata.undeletable){
                new_cell = false;
                Jupyter.notebook.undelete_cell();
            }
        })

        events.on("kernel_busy.Kernel", function (e, a, b, c) {
            var cell = Jupyter.notebook.get_selected_cell()
            if (cell.cell_type != "code"){return null;}
            if((!cell.metadata.test || cell.metadata.test == undefined) && !begin){
                check_solution()
            } else if(cell.metadata.test){
                Jupyter.notebook.select_next()
            }
            
            begin = false
        })

        events.on('file_saving.Editor', function() {
            Jupyter.notebook.get_cells().forEach(function(cell) {
                cell.metadata.undeletable = false
                cell.metadata.deletable = true
                if (cell.cell_type != "code" || (cell.metadata.example != undefined && cell.metadata.example)){
                    cell.metadata.editable = true
                    cell.rendered = true
                }
                if (cell.metadata.test  || cell.metadata.hide) {
                    cell.element.find("div.input").show();
                }
                cell.element.show()
            })
        })


        events.on('file_saved.Editor', function() {
            Jupyter.notebook.get_cells().forEach(function(cell) {
                cell.metadata.undeletable = true
                cell.metadata.deletable = false
                if (cell.cell_type != "code" || (cell.metadata.example != undefined && cell.metadata.example)){
                    cell.metadata.editable = false
                    cell.rendered = false
                }
                if (cell.metadata.test  || cell.metadata.hide) {
                    cell.element.find("div.input").hide();
                }
            })
        })

    };

    return {
        load_ipython_extension : load_ipython_extension
    };
});
