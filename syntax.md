## Declaration

```
A = nameA
B = nameB
C = nameC
```

## Flow

```
A > B
A > B: do something
B < A: do something
A: I am doing something
A <> B: do something
```

## Group

```
A: create a group
```

Use Case:
```
A: create a group
    A > B: do something
    B < A: do something
    A: I am doing something
    A <> B: do something
    B: create a group
        A > B: do something
        B < A: do something
        A: I am doing something
        A <> B: do something
```

## Payload

```
A(a, b): I am carrying a and b
A > B[c, d]: I am creating c and d
A > B(a, b)[c, d]: I am carrying a and b, creating c and d
```

## Others

```
- this is a line
# this is a note
```