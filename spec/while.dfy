method main()
{
  var x: int;
  assume x == 42;
  while (x > 0) {
    x := x - 1;
  }
  assert x == 0;
}
