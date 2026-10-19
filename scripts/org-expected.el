;;; org-expected.el --- Org fixture oracle -*- lexical-binding: t; -*-
(require 'org)
(require 'org-table)
(require 'json)
(princ (format "Org oracle: Emacs %s / Org %s\n" emacs-version (org-version)))
(let ((files (directory-files "tests/fixtures/org" t "\\.org$")))
  (dolist (file files)
    ;; Lisp is explicitly unsupported; its diagnostic is checked by unit tests.
    (unless (string-match-p "/error\\.org$" file)
      (with-temp-buffer
        (insert-file-contents file)
        (org-mode)
        (org-table-recalculate-buffer-tables)
        ;; Extract real tables through Org's own structure, excluding literal
        ;; source/example blocks independently of the JavaScript adapter.
        (let (rows)
          (org-table-map-tables
           (lambda ()
             (setq rows (append rows (seq-filter #'listp (org-table-to-lisp)))))
           t 'org)
          (with-temp-file
              (expand-file-name
               (concat (file-name-nondirectory file) ".expected")
               (getenv "SHEETS_ORG_OUTPUT"))
            (insert (json-encode (vconcat (mapcar #'vconcat rows))))))))))
