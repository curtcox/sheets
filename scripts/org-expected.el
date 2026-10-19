;;; org-expected.el --- Org fixture oracle -*- lexical-binding: t; -*-
(require 'org)
(require 'org-table)
(require 'json)
(princ (format "Org oracle: Emacs %s / Org %s\n" emacs-version (org-version)))
(let ((files (append (directory-files "tests/fixtures/org" t "\\.org$")
                     (directory-files "tests/fixtures/org/rejected" t "\\.org$"))))
  (dolist (file files)
    ;; Lisp is explicitly unsupported; its diagnostic is checked by unit tests.
    (unless (string-match-p "/error\\.org$" file)
      (with-temp-buffer
        (insert-file-contents file)
        (org-mode)
        (let (rejection)
          (condition-case err
              (org-table-recalculate-buffer-tables)
            (user-error
             (if (string-match-p "/rejected/" file)
                 (setq rejection "user-error")
               (signal (car err) (cdr err)))))
          (when (and (string-match-p "/rejected/" file) (not rejection))
            (error "Expected native rejection: %s" file))
          ;; Extract real tables through Org's own structure, excluding literal
          ;; source/example blocks independently of the JavaScript adapter.
          (let (rows)
            ;; org-table-map-tables gained its TYPE argument after Org 9.6.
            ;; Use the stable element API on both the CI and local versions.
            (org-element-map (org-element-parse-buffer) 'table
			     (lambda (table)
			       (when (eq (org-element-property :type table) 'org)
				 (goto-char (org-element-property :begin table))
				 ;; Affiliated NAME/CAPTION keywords belong to the element,
				 ;; but org-table-to-lisp needs the first actual table line.
				 (re-search-forward "^[ \t]*|" (org-element-property :end table) t)
				 (beginning-of-line)
				 (setq rows (append rows (seq-filter #'listp (org-table-to-lisp)))))))
            (with-temp-file
		(expand-file-name
		 (concat (file-name-nondirectory file)
			 (if rejection ".rejected" ".expected"))
		 (getenv "SHEETS_ORG_OUTPUT"))
              (insert (json-encode
                       (if rejection
                           `((type . ,rejection) (rows . ,(vconcat (mapcar #'vconcat rows))))
			 (vconcat (mapcar #'vconcat rows))))))))))))
