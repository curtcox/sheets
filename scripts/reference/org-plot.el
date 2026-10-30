;;; org-plot.el --- org-plot extraction oracle -*- lexical-binding: t; -*-
;; Runs the real `org-plot/gnuplot' for every table whose keyword block
;; mentions #+PLOT:, after recalculating the buffer. gnuplot is never run: a
;; stub feature captures the generated script, and the data file is read back.
;; Records merged options, the x mode, plot lines and the data dump.
(require 'org)
(require 'org-table)
(require 'org-plot)
(require 'json)
(require 'seq)
(princ (format "org-plot oracle: Emacs %s / Org %s\n" emacs-version (org-version)))

(defvar sheets-plot--script nil)
(defvar sheets-plot--params nil)
(defun gnuplot-mode () nil)
(defun gnuplot-send-buffer-to-gnuplot ()
  (setq sheets-plot--script (buffer-string)))
(provide 'gnuplot)
(advice-add 'org-plot/gnuplot-script :before
            (lambda (_table _data-file num-cols params &rest _)
              (setq sheets-plot--params (cons num-cols (copy-sequence params)))))

(defun sheets-plot--json (value)
  "Lisp VALUE as JSON-ready data. Symbols become their names."
  (cond ((null value) nil)
        ((eq value t) "t")
        ((or (stringp value) (numberp value)) value)
        ((symbolp value) (symbol-name value))
        ((consp value) (vconcat (mapcar #'sheets-plot--json value)))
        (t (format "%S" value))))

(defun sheets-plot--read (file)
  (with-temp-buffer (insert-file-contents file) (buffer-string)))

(defun sheets-plot--record (line)
  (setq sheets-plot--script nil sheets-plot--params nil)
  (condition-case err
      (progn
        (org-plot/gnuplot)
        (let* ((script sheets-plot--script)
               (params (cdr sheets-plot--params))
               (file (and (string-match "'\\([^'\n]*org-plot[^'\n]*\\)'" script)
                          (match-string 1 script)))
               (setup (and (string-match "load \"\\([^\"\n]+\\)\"" script)
                           (match-string 1 script)))
               (plot (and (string-match "^s?plot \\(\\(?:.\\|\n\\)*\\)\\'" script)
                          (match-string 1 script)))
               (ytics (and (string-match "^set ytics (\\(.*\\))$" script)
                           (match-string 1 script))))
          `((line . ,line)
            (numCols . ,(car sheets-plot--params))
            (options
             . ,(delq nil
                      (mapcar
                       (lambda (key)
                         (when (plist-member params key)
                           (cons (substring (symbol-name key) 1)
                                 (sheets-plot--json (plist-get params key)))))
                       '(:plot-type :ind :deps :with :title :labels :set :line
                                    :file :map :timeind :timefmt :textind :ymin
                                    :ymax :xmin :xmax :ticks :transpose :script))))
            (plots . ,(if plot
                          (vconcat
                           (mapcar (lambda (part)
                                     (replace-regexp-in-string
                                      "\\`'[^']*' " "" (string-trim part)))
                                   (split-string plot ",\\\\\n" t)))
                        []))
            (data . ,(if file (sheets-plot--read file) nil))
            (setup . ,(if setup (sheets-plot--read setup) nil))
            (ytics . ,(or ytics nil)))))
    ;; Emacs 29 appends the file being loaded to end-of-file errors; later versions do not.
    (error `((line . ,line)
             (error . ,(if (eq (car err) 'end-of-file)
                           (get 'end-of-file 'error-message)
                         (error-message-string err)))))))

(let ((output (getenv "SHEETS_ORG_OUTPUT"))
      (files (append (directory-files "tests/fixtures/org-plot" t "\\.org\\'")
                     (let ((pasted (expand-file-name "pasted" (getenv "SHEETS_ORG_OUTPUT"))))
                       (and (file-directory-p pasted)
                            (directory-files pasted t "\\.org\\'"))))))
  (dolist (file files)
    (with-temp-buffer
      (insert-file-contents file)
      (org-mode)
      (org-table-recalculate-buffer-tables)
      (let (starts records)
        (org-element-map (org-element-parse-buffer) 'table
          (lambda (table)
            (when (eq (org-element-property :type table) 'org)
              (push (org-element-property :contents-begin table) starts))))
        (dolist (start (nreverse starts))
          (goto-char start)
          (let ((line (line-number-at-pos)) plot-line)
            (save-excursion
              (while (and (zerop (forward-line -1))
                          (looking-at "[[:space:]]*#\\+"))
                (when (looking-at "[[:space:]]*#\\+plot:") (setq plot-line t))))
            (when plot-line
              (goto-char start)
              (push (sheets-plot--record line) records))))
        (with-temp-file (expand-file-name (concat (file-name-nondirectory file) ".plot") output)
          (insert (json-encode (vconcat (nreverse records)))))))))
